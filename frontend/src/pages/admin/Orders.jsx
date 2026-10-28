import { useState, useEffect } from 'react';
import supabase from '../../supabaseClient';
import { 
  Package, Clock, Truck, CheckCircle2, XCircle, Printer, Eye, 
  Trash2, Phone, Search, Calendar, ChevronRight, AlertCircle, ShoppingBag, MessageCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

const Orders = () => {
  const [pedidos, setPedidos] = useState([]);
  const [motoboys, setMotoboys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('pendentes'); // pendentes, concluidos, todos
  const [searchCode, setSearchCode] = useState('');

  // Modais
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Modal para atribuir Motoboy
  const [motoboyModalOpen, setMotoboyModalOpen] = useState(false);
  const [orderToDispatch, setOrderToDispatch] = useState(null);
  const [selectedMotoboyId, setSelectedMotoboyId] = useState('');

  useEffect(() => {
    fetchOrdersAndMotoboys();
  }, [activeFilter]);

  // Polling ultra rápido (a cada 5 segundos) para atualizar a lista automaticamente
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrdersAndMotoboys(true); // O true faz atualizar silenciosamente, sem piscar a tela
    }, 5000);
    return () => clearInterval(interval);
  }, [activeFilter]);

  const fetchOrdersAndMotoboys = async (isSilent = false) => {
    if (!isSilent) setLoading(true);

    try {
      let query = supabase
        .from('pedidos')
        .select('*, motoboys(nome, telefone)')
        .order('created_at', { ascending: false });

      if (activeFilter === 'pendentes') {
        query = query.in('status', ['RECEBIDO', 'PREPARANDO', 'SAIU_ENTREGA']);
      } else if (activeFilter === 'concluidos') {
        query = query.in('status', ['ENTREGUE', 'CANCELADO']);
      }

      const [ordersRes, motoboysRes] = await Promise.all([
        query,
        supabase.from('motoboys').select('*').eq('ativo', true).order('nome', { ascending: true })
      ]);

      if (ordersRes.data) setPedidos(ordersRes.data);
      if (motoboysRes.data) setMotoboys(motoboysRes.data);
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const handleStatusChange = async (pedidoId, newStatus) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: newStatus })
        .eq('id', pedidoId);

      if (error) throw error;
      toast.success(`Status alterado para ${newStatus}`);
      fetchOrdersAndMotoboys(true);
      
      // Se o modal de detalhes estiver aberto e o pedido for o mesmo, atualiza localmente
      if (selectedOrder && selectedOrder.id === pedidoId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err) {
      toast.error('Erro ao atualizar status: ' + err.message);
    }
  };

  const handleMotoboyChange = async (pedidoId, newMotoboyId) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ motoboy_id: newMotoboyId || null })
        .eq('id', pedidoId);

      if (error) throw error;
      toast.success('Motoboy vinculado com sucesso!');
      fetchOrdersAndMotoboys(true);
      
      if (selectedOrder && selectedOrder.id === pedidoId) {
        setSelectedOrder({ ...selectedOrder, motoboy_id: newMotoboyId || null });
      }
    } catch (err) {
      toast.error('Erro ao vincular motoboy: ' + err.message);
    }
  };

  const handleOpenDetails = async (pedido) => {
    setSelectedOrder(pedido);
    setDetailsModalOpen(true);
    setLoadingItems(true);

    try {
      const { data } = await supabase
        .from('itens_pedido')
        .select('*, produtos(nome, valor)')
        .eq('pedido_id', pedido.id);

      setOrderItems(data || []);
    } catch (err) {
      console.error('Erro ao buscar itens:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const printThermalReceipt = async (pedido) => {
    // Abre a janela IMEDIATAMENTE no clique (antes do await) para o Chrome no Linux/Windows nunca bloquear
    const printWindow = window.open('', '_blank', 'width=420,height=650');
    if (!printWindow) {
      toast.error('Permita popups no navegador para imprimir a comanda.');
      return;
    }

    printWindow.document.write('<html><body style="font-family:sans-serif;padding:20px;text-align:center;">Gerando comanda para impressão...</body></html>');

    // Busca itens caso não tenha
    let itens = [];
    try {
      const { data } = await supabase
        .from('itens_pedido')
        .select('*, produtos(nome)')
        .eq('pedido_id', pedido.id);
      itens = data || [];
    } catch (e) {
      console.error('Erro ao buscar itens para impressão:', e);
    }

    // Formata método de pagamento
    let formaPgto = pedido.metodo_pagamento || 'Não informado';
    if (formaPgto === 'PIX') formaPgto = 'PIX';
    else if (formaPgto === 'CREDITO') formaPgto = 'Cartão de Crédito (Máquina)';
    else if (formaPgto === 'DEBITO') formaPgto = 'Cartão de Débito (Máquina)';
    else if (formaPgto === 'DINHEIRO') formaPgto = 'Dinheiro';

    // Monta itens em tabela estruturada sem quebra desordenada
    const rowsHtml = itens.map(i => {
      const nomeProd = i.produtos ? i.produtos.nome : 'Item';
      const valorUnit = Number(i.preco_unitario || 0);
      const totalItem = valorUnit * Number(i.quantidade || 1);
      
      let variacoesTxt = '';
      if (Array.isArray(i.variacoes) && i.variacoes.length > 0) {
        variacoesTxt = i.variacoes.map(v => `• ${v.grupo_nome || ''}: ${(v.opcoes || []).map(o => o.nome).join(', ')}`).join('<br/>');
      }

      return `
        <tr style="border-bottom: 1px dashed #000;">
          <td style="vertical-align: top; font-weight: bold; padding: 4px 0; width: 30px;">${i.quantidade}x</td>
          <td style="vertical-align: top; padding: 4px 4px 4px 0; word-break: break-word;">
            <div style="font-weight: bold; font-size: 11px;">${nomeProd}</div>
            ${i.quantidade > 1 ? `<div style="font-size: 9px; color: #000;">(Un: R$ ${valorUnit.toFixed(2).replace('.', ',')})</div>` : ''}
            ${variacoesTxt ? `<div style="font-size: 9px; margin-top: 1px;">${variacoesTxt}</div>` : ''}
            ${i.observacao ? `<div style="font-size: 9px; font-weight: bold; margin-top: 1px;">[Obs: ${i.observacao}]</div>` : ''}
          </td>
          <td style="vertical-align: top; text-align: right; white-space: nowrap; font-weight: bold; padding: 4px 0; width: 68px;">
            R$ ${totalItem.toFixed(2).replace('.', ',')}
          </td>
        </tr>
      `;
    }).join('');

    const subtotal = Number(pedido.subtotal || 0).toFixed(2).replace('.', ',');
    const frete = Number(pedido.taxa_entrega || 0).toFixed(2).replace('.', ',');
    const total = Number(pedido.total || 0).toFixed(2).replace('.', ',');
    const dataHora = new Date(pedido.created_at).toLocaleString('pt-BR');
    const codigoFormatado = String(pedido.codigo_pedido).padStart(4, '0');
    const motoboyNome = pedido.motoboys?.nome;
    // Altura inicial estimada em mm baseada na quantidade de itens (mínimo 100mm)
    const alturaInicialMm = Math.max(100, 85 + (itens.length * 14));

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Comanda #${codigoFormatado} - Refresca</title>
          <style>
            @page {
              size: 80mm ${alturaInicialMm}mm;
              margin: 0mm;
            }
            @media screen {
              html, body {
                background-color: #070B16 !important;
                min-height: 100vh;
                margin: 0;
                padding: 0 0 24px 0;
                font-family: system-ui, -apple-system, sans-serif;
              }
              .screen-toolbar {
                position: sticky;
                top: 0;
                z-index: 50;
                background: rgba(16, 25, 53, 0.95);
                backdrop-filter: blur(8px);
                border-bottom: 1px solid rgba(255,255,255,0.1);
                padding: 10px 14px;
                margin-bottom: 16px;
              }
              .toolbar-inner {
                max-width: 340px;
                margin: 0 auto;
                display: flex;
                flex-direction: column;
                gap: 8px;
              }
              .toolbar-badge {
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: #9CA3AF !important;
              }
              .toolbar-badge span.dot {
                color: #00E5FF !important;
              }
              .paper-sheet {
                width: 80mm;
                max-width: calc(100vw - 20px);
                margin: 0 auto;
                background-color: #ffffff !important;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.08);
                border-radius: 4px;
                overflow: hidden;
              }
            }
            @media print {
              html, body {
                width: 80mm !important;
                max-width: 80mm !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                background-color: #ffffff !important;
                color: #000000 !important;
              }
              .paper-sheet {
                width: 80mm !important;
                max-width: 80mm !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                border-radius: 0 !important;
              }
              #receipt-container {
                width: 72mm !important;
                max-width: 72mm !important;
                margin: 0 auto !important;
                padding: 3mm 0 6mm 0 !important;
              }
              .no-print {
                display: none !important;
              }
            }
            #receipt-container, #receipt-container * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              color: #000000 !important;
              font-family: 'Liberation Mono', 'DejaVu Sans Mono', 'Courier New', Courier, monospace;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #receipt-container {
              background-color: #ffffff !important;
              width: 72mm;
              max-width: 72mm;
              margin: 0 auto;
              padding: 4mm 0 6mm 0;
              font-size: 11px;
              line-height: 1.25;
              font-weight: 700;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: 900; }
            .sep-line {
              border-top: 1px dashed #000000;
              margin: 5px 0;
            }
            .sep-double {
              border-top: 2px solid #000000;
              margin: 6px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            .actions-bar {
              display: flex;
              gap: 8px;
              width: 100%;
            }
            .btn-imprimir {
              flex: 1;
              background: #00E5FF !important;
              color: #070B16 !important;
              padding: 9px 12px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              font-size: 11px;
              border: none;
              cursor: pointer;
              border-radius: 8px;
            }
            .btn-fechar {
              background: rgba(255,255,255,0.08) !important;
              color: #ffffff !important;
              padding: 9px 14px;
              font-weight: 700;
              font-size: 11px;
              border: 1px solid rgba(255,255,255,0.15);
              cursor: pointer;
              border-radius: 8px;
            }
          </style>
          <style id="dynamic-page-size"></style>
        </head>
        <body>
          <div class="no-print screen-toolbar">
            <div class="toolbar-inner">
              <div class="toolbar-badge">
                <span><span class="dot">●</span> Bobina 80mm (72mm úteis)</span>
                <span>#${codigoFormatado}</span>
              </div>
              <div class="actions-bar">
                <button class="btn-imprimir" onclick="executarImpressao()">🖨️ Imprimir Comanda</button>
                <button class="btn-fechar" onclick="window.close()">✕ Fechar</button>
              </div>
            </div>
          </div>

          <div class="paper-sheet">
          <div id="receipt-container">
            <!-- CABEÇALHO DA EMPRESA -->
            <div class="center">
              <div style="font-size: 14px; font-weight: 900; letter-spacing: 0.5px;">REFRESCA BEBIDAS</div>
              <div style="font-size: 10px;">DISTRIBUIDORA & DEPÓSITO</div>
              <div style="font-size: 10px;">Rua São Tillon, 141 - Barra da Tijuca</div>
              <div style="font-size: 10px;">WhatsApp: (21) 98378-5928</div>
            </div>

            <div class="sep-double"></div>

            <!-- IDENTIFICAÇÃO DO PEDIDO -->
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <span style="font-size: 14px; font-weight: 900;">PEDIDO: #${codigoFormatado}</span>
              <span style="font-size: 10px;">${dataHora}</span>
            </div>
            ${pedido.is_agendado ? '<div class="center bold" style="margin-top: 2px; font-size: 11px;">*** PEDIDO AGENDADO (PROGRAMADO) ***</div>' : ''}

            <div class="sep-line"></div>

            <!-- DADOS DO CLIENTE E ENTREGA -->
            <div style="font-size: 11px;">
              <div><strong>CLIENTE:</strong> ${pedido.cliente_nome || 'Cliente'}</div>
              <div><strong>TEL:</strong> ${pedido.cliente_telefone || '-'}</div>
              <div style="margin-top: 2px;"><strong>ENDEREÇO:</strong> ${pedido.endereco_completo || '-'}</div>
              <div><strong>BAIRRO:</strong> ${pedido.bairro || '-'}</div>
              ${motoboyNome ? `<div style="margin-top: 2px;"><strong>ENTREGADOR:</strong> ${motoboyNome}</div>` : ''}
            </div>

            <div class="sep-double"></div>

            <!-- TABELA DE ITENS -->
            <table>
              <thead>
                <tr style="border-bottom: 1px solid #000000; font-size: 10px;">
                  <th style="text-align: left; padding-bottom: 3px; width: 30px;">QTD</th>
                  <th style="text-align: left; padding-bottom: 3px;">DESCRIÇÃO</th>
                  <th style="text-align: right; padding-bottom: 3px; width: 68px;">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <div class="sep-line"></div>

            <!-- RESUMO FINANCEIRO -->
            <table>
              <tr>
                <td>Subtotal:</td>
                <td class="right">R$ ${subtotal}</td>
              </tr>
              <tr>
                <td>Taxa de Entrega:</td>
                <td class="right">R$ ${frete}</td>
              </tr>
              ${pedido.cupom_aplicado ? `
                <tr>
                  <td>Cupom (${pedido.cupom_aplicado}):</td>
                  <td class="right bold">Aplicado</td>
                </tr>
              ` : ''}
            </table>

            <div class="sep-line"></div>

            <!-- TOTAL GERAL EM DESTAQUE -->
            <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; margin: 2px 0;">
              <span>TOTAL A PAGAR:</span>
              <span>R$ ${total}</span>
            </div>

            <div class="sep-double"></div>

            <!-- FORMA DE PAGAMENTO -->
            <div style="font-size: 11px;">
              <div><strong>PAGAMENTO:</strong> ${formaPgto}</div>
            </div>

            <div class="sep-line"></div>

            <!-- RODAPÉ E MENSAGEM -->
            <div class="center" style="font-size: 10px; margin-top: 4px;">
              Bebida gelada no seu evento em minutos!<br/>
              depositorefresca.com.br
            </div>

            <!-- MARGEM CURTA DE AVANÇO PARA CORTE DA GUILHOTINA SEM SOBRA DE PAPEL A4 -->
            <div style="height: 12mm; line-height: 12mm; text-align: center;">&nbsp;</div>
          </div>
          </div>

          <script>
            function executarImpressao() {
              var container = document.getElementById('receipt-container');
              if (container) {
                var alturaPx = container.offsetHeight;
                var alturaMm = Math.max(85, Math.ceil((alturaPx * 25.4) / 96) + 6);
                var styleEl = document.getElementById('dynamic-page-size');
                if (styleEl) {
                  styleEl.innerHTML = '@page { size: 80mm ' + alturaMm + 'mm; margin: 0mm; }';
                }
              }
              window.focus();
              window.print();
            }
            window.addEventListener('keydown', function(e) {
              if (e.key === 'Escape') window.close();
              if (e.key === 'Enter') executarImpressao();
            });
            setTimeout(executarImpressao, 350);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDeletePedido = async (id, codigo_pedido) => {
    if (!window.confirm(`Tem certeza que deseja EXCLUIR o pedido #${codigo_pedido}? Esta ação não pode ser desfeita.`)) return;
    
    try {
      // Deleta primeiro os itens do pedido (se não houver cascade)
      await supabase.from('itens_pedido').delete().eq('pedido_id', id);
      // Deleta o pedido
      const { error } = await supabase.from('pedidos').delete().eq('id', id);
      
      if (error) throw error;
      toast.success('Pedido excluído com sucesso!');
      setPedidos(pedidos.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir pedido');
    }
  };

  const normalizeString = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";

  const filteredPedidos = pedidos.filter(p => {
    if (!searchCode) return true;
    const term = normalizeString(searchCode);
    return String(p.codigo_pedido).includes(term) || normalizeString(p.cliente_nome).includes(term);
  });

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'RECEBIDO':
        return 'bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/40';
      case 'PREPARANDO':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/40';
      case 'SAIU_ENTREGA':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40';
      case 'ENTREGUE':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40';
      case 'CANCELADO':
        return 'bg-red-500/15 text-red-400 border-red-500/40';
      default:
        return 'bg-white/10 text-gray-300 border-white/20';
    }
  };

  const countRecebidos = pedidos.filter(p => p.status === 'RECEBIDO').length;
  const countPreparando = pedidos.filter(p => p.status === 'PREPARANDO').length;
  const countEmRota = pedidos.filter(p => p.status === 'SAIU_ENTREGA').length;
  const countFinalizados = pedidos.filter(p => p.status === 'ENTREGUE').length;

  return (
    <div className="space-y-5 max-w-full">
      
      {/* Top Header com Filtros Responsivos */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-black uppercase text-white tracking-wider flex items-center gap-2.5">
            <ShoppingBag className="text-[#00E5FF] shrink-0" /> Gestão de Pedidos
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Controle de expedição, impressão térmica 80mm e motoboys em tempo real.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input 
              type="text" 
              placeholder="Buscar por #código ou cliente..." 
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="w-full bg-[#101935] border border-white/10 rounded-xl px-4 py-2.5 pl-9 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF] transition-colors"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>

          <div className="flex bg-[#101935] border border-white/10 rounded-xl p-1 text-[11px] overflow-x-auto">
            {[
              { id: 'pendentes', label: 'Ativos' },
              { id: 'concluidos', label: 'Finalizados' },
              { id: 'todos', label: 'Todos' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`flex-1 sm:flex-none px-3.5 py-2 sm:py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeFilter === f.id
                    ? 'bg-[#00E5FF] text-[#0A0F1D] shadow-md shadow-cyan-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Barra Rápida de Status (KPIs Operacionais) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-[#101935] border border-[#00E5FF]/20 rounded-2xl p-3 sm:p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Novos / Recebidos</span>
            <span className="text-lg sm:text-2xl font-display font-black text-[#00E5FF]">{countRecebidos}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center">
            <AlertCircle size={18} />
          </div>
        </div>

        <div className="bg-[#101935] border border-amber-500/20 rounded-2xl p-3 sm:p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Separando</span>
            <span className="text-lg sm:text-2xl font-display font-black text-amber-400">{countPreparando}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock size={18} />
          </div>
        </div>

        <div className="bg-[#101935] border border-indigo-500/20 rounded-2xl p-3 sm:p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Em Rota</span>
            <span className="text-lg sm:text-2xl font-display font-black text-indigo-300">{countEmRota}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-300 flex items-center justify-center">
            <Truck size={18} />
          </div>
        </div>

        <div className="bg-[#101935] border border-emerald-500/20 rounded-2xl p-3 sm:p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Entregues (Lista)</span>
            <span className="text-lg sm:text-2xl font-display font-black text-emerald-400">{countFinalizados}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={18} />
          </div>
        </div>
      </div>

      {/* Lista de Pedidos - Híbrida Responsiva (Cards em Mobile/Tablet/Split-screen & Tabela Fluida em Telas Grandes) */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="w-10 h-10 border-4 border-[#00E5FF]/20 border-t-[#00E5FF] rounded-full animate-spin" />
        </div>
      ) : filteredPedidos.length === 0 ? (
        <div className="text-center py-16 bg-[#101935] rounded-3xl border border-white/5 p-8">
          <Package size={40} className="mx-auto text-gray-600 mb-3" />
          <h3 className="text-white font-bold text-base">Nenhum pedido encontrado</h3>
          <p className="text-xs text-gray-400">Não há pedidos para o filtro selecionado no momento.</p>
        </div>
      ) : (
        <>
          {/* VISÃO EM CARDS (Mobile, Tablet e Janelas Divididas até 1279px) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xl:hidden">
            {filteredPedidos.map((pedido) => {
              const cod = String(pedido.codigo_pedido).padStart(4, '0');
              const dataCurta = new Date(pedido.created_at).toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
              });
              const foneLimpo = (pedido.cliente_telefone || '').replace(/\D/g, '');

              return (
                <div
                  key={pedido.id}
                  onClick={() => handleOpenDetails(pedido)}
                  className="bg-[#101935] border border-white/10 hover:border-[#00E5FF]/40 rounded-2xl p-4 flex flex-col justify-between gap-3.5 transition-all shadow-lg cursor-pointer"
                >
                  {/* Topo do Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-display font-black text-base text-white bg-[#0A0F1D] border border-white/10 px-3 py-1 rounded-xl">
                        #{cod}
                      </span>
                      <div>
                        <h3 className="font-bold text-white text-sm leading-tight">{pedido.cliente_nome}</h3>
                        <span className="text-[11px] text-gray-400 block mt-0.5">{dataCurta}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-display font-black text-base text-[#00E5FF] block leading-tight">
                        R$ {Number(pedido.total || 0).toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-white/5 px-2 py-0.5 rounded-md inline-block mt-0.5">
                        {pedido.metodo_pagamento}
                      </span>
                    </div>
                  </div>

                  {/* Endereço e Contato Rápido */}
                  <div className="bg-[#0A0F1D]/70 border border-white/5 rounded-xl p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#00E5FF]">
                        📍 {pedido.bairro}
                      </span>
                      {foneLimpo && (
                        <a
                          href={`https://wa.me/55${foneLimpo}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] font-bold text-[#25D366] hover:underline flex items-center gap-1"
                        >
                          <Phone size={11} /> {pedido.cliente_telefone}
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-gray-300 line-clamp-2 leading-snug">
                      {pedido.endereco_completo}
                    </p>
                  </div>

                  {/* Seletores Rápidos: Status e Motoboy */}
                  <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                        Status
                      </label>
                      <select
                        value={pedido.status}
                        onChange={(e) => handleStatusChange(pedido.id, e.target.value)}
                        className={`w-full border rounded-xl px-2.5 py-2 text-[11px] font-bold uppercase tracking-wider focus:outline-none ${getStatusBadgeStyle(pedido.status)} bg-[#0A0F1D]`}
                      >
                        <option value="RECEBIDO" className="bg-[#0A0F1D] text-white">Recebido</option>
                        <option value="PREPARANDO" className="bg-[#0A0F1D] text-white">Preparando</option>
                        <option value="SAIU_ENTREGA" className="bg-[#0A0F1D] text-white">Em Rota</option>
                        <option value="ENTREGUE" className="bg-[#0A0F1D] text-white">Entregue</option>
                        <option value="CANCELADO" className="bg-[#0A0F1D] text-white">Cancelado</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                        Entregador
                      </label>
                      <select
                        value={pedido.motoboy_id || ''}
                        onChange={(e) => handleMotoboyChange(pedido.id, e.target.value)}
                        className="w-full bg-[#0A0F1D] border border-white/10 rounded-xl px-2.5 py-2 text-[11px] font-bold uppercase tracking-wider text-white focus:outline-none focus:border-[#00E5FF]"
                      >
                        <option value="">Selecione...</option>
                        {motoboys.map(m => (
                          <option key={m.id} value={m.id}>{m.nome}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Barra de Ações do Card */}
                  <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => printThermalReceipt(pedido)}
                      className="flex-1 bg-[#00E5FF] hover:bg-[#00B4D8] text-[#0A0F1D] py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-cyan-500/15"
                    >
                      <Printer size={15} /> Imprimir Comanda
                    </button>
                    <button
                      onClick={() => handleOpenDetails(pedido)}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 p-2.5 rounded-xl transition-colors"
                      title="Ver detalhes"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDeletePedido(pedido.id, pedido.codigo_pedido)}
                      className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 p-2.5 rounded-xl transition-colors"
                      title="Excluir pedido"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* VISÃO EM TABELA FLUIDA (Desktop Largo xl+) */}
          <div className="hidden xl:block bg-[#101935] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-[#070B16]/60 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  <th className="py-4 px-4 font-medium">Pedido</th>
                  <th className="py-4 px-4 font-medium">Cliente / Contato</th>
                  <th className="py-4 px-4 font-medium">Bairro / Endereço</th>
                  <th className="py-4 px-4 font-medium">Total / Pgto</th>
                  <th className="py-4 px-4 font-medium">Status</th>
                  <th className="py-4 px-4 font-medium">Motoboy</th>
                  <th className="py-4 px-4 font-medium text-right">Expedição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPedidos.map((pedido) => (
                  <tr 
                    key={pedido.id} 
                    className="hover:bg-white/5 transition-colors group cursor-pointer"
                    onClick={() => handleOpenDetails(pedido)}
                  >
                    <td className="py-4 px-4 align-middle">
                      <span className="font-display font-black text-white bg-[#0A0F1D] border border-white/10 px-2.5 py-1 rounded-lg text-xs">
                        #{String(pedido.codigo_pedido).padStart(4, '0')}
                      </span>
                      <span className="block text-[10px] text-gray-500 mt-1">
                        {new Date(pedido.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-4 px-4 align-middle">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-white text-sm">
                          {pedido.cliente_nome}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {pedido.cliente_telefone}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 align-middle max-w-[240px]">
                      <span className="text-xs font-bold text-[#00E5FF] block">{pedido.bairro}</span>
                      <span className="text-[11px] text-gray-400 truncate block" title={pedido.endereco_completo}>
                        {pedido.endereco_completo}
                      </span>
                    </td>
                    <td className="py-4 px-4 align-middle">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-display font-black text-[#00E5FF] text-sm">
                          R$ {Number(pedido.total || 0).toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                          {pedido.metodo_pagamento}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 align-middle" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={pedido.status}
                        onChange={(e) => handleStatusChange(pedido.id, e.target.value)}
                        className={`border rounded-xl px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider focus:outline-none ${getStatusBadgeStyle(pedido.status)} bg-[#0A0F1D]`}
                      >
                        <option value="RECEBIDO" className="bg-[#0A0F1D] text-white">Recebido</option>
                        <option value="PREPARANDO" className="bg-[#0A0F1D] text-white">Preparando</option>
                        <option value="SAIU_ENTREGA" className="bg-[#0A0F1D] text-white">Em Rota</option>
                        <option value="ENTREGUE" className="bg-[#0A0F1D] text-white">Entregue</option>
                        <option value="CANCELADO" className="bg-[#0A0F1D] text-white">Cancelado</option>
                      </select>
                    </td>
                    <td className="py-4 px-4 align-middle" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={pedido.motoboy_id || ''}
                        onChange={(e) => handleMotoboyChange(pedido.id, e.target.value)}
                        className="bg-[#0A0F1D] border border-white/10 rounded-xl px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white focus:outline-none focus:border-[#00E5FF] min-w-[130px]"
                      >
                        <option value="">Selecione...</option>
                        {motoboys.map(m => (
                          <option key={m.id} value={m.id}>{m.nome}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 px-4 align-middle" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => printThermalReceipt(pedido)}
                          className="bg-[#00E5FF] hover:bg-[#00B4D8] text-[#0A0F1D] px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <Printer size={14} /> Imprimir
                        </button>
                        <button
                          onClick={() => handleOpenDetails(pedido)}
                          className="bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 p-2 rounded-xl transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleDeletePedido(pedido.id, pedido.codigo_pedido)}
                          className="bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 p-2 rounded-xl transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* MODAL DETALHES DO PEDIDO (DIVIDIDO E RESPONSIVO) */}
      {detailsModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#101935] rounded-3xl max-w-4xl w-full flex flex-col md:flex-row overflow-hidden border border-white/10 max-h-[92vh] shadow-2xl">
            
            {/* LADO ESQUERDO: Simulação Fiel da Comanda 80mm */}
            <div className="w-full md:w-1/2 bg-[#070B16] p-4 sm:p-6 flex flex-col items-center justify-start overflow-y-auto border-b md:border-b-0 md:border-r border-white/10">
              <div className="w-full max-w-[300px] mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00E5FF]"></span> Preview Bobina 80mm
                </span>
                <span>72mm Úteis</span>
              </div>

              <div className="bg-white p-4 shadow-2xl text-black font-mono text-[11px] leading-snug w-full max-w-[300px] rounded-sm">
                <div className="text-center">
                  <div className="font-black text-sm tracking-tight">REFRESCA BEBIDAS</div>
                  <div className="text-[10px] font-bold">DISTRIBUIDORA & DEPÓSITO</div>
                  <div className="text-[10px]">Rua São Tillon, 141 - Barra da Tijuca</div>
                  <div className="text-[10px]">WhatsApp: (21) 98378-5928</div>
                </div>

                <div className="border-t-2 border-black my-2"></div>

                <div className="flex justify-between items-baseline">
                  <span className="font-black text-xs">PEDIDO: #{String(selectedOrder.codigo_pedido).padStart(4, '0')}</span>
                  <span className="text-[10px]">{new Date(selectedOrder.created_at).toLocaleString('pt-BR')}</span>
                </div>

                <div className="border-t border-dashed border-black my-2"></div>

                <div className="space-y-0.5 text-[11px]">
                  <p><strong>CLIENTE:</strong> {selectedOrder.cliente_nome}</p>
                  <p><strong>TEL:</strong> {selectedOrder.cliente_telefone}</p>
                  <p><strong>ENDEREÇO:</strong> {selectedOrder.endereco_completo}</p>
                  <p><strong>BAIRRO:</strong> {selectedOrder.bairro}</p>
                </div>

                <div className="border-t-2 border-black my-2"></div>

                <div className="mb-2">
                  <div className="flex justify-between font-black text-[10px] border-b border-black pb-1 mb-1.5">
                    <span>QTD / DESCRIÇÃO</span>
                    <span>TOTAL</span>
                  </div>
                  {loadingItems ? (
                    <p className="text-gray-500 py-2 text-center">Carregando itens...</p>
                  ) : (
                    orderItems.map((item, idx) => (
                      <div key={idx} className="py-1 border-b border-dashed border-black/40">
                        <div className="flex justify-between items-start font-bold">
                          <span className="pr-2">{item.quantidade}x {item.produtos?.nome || 'Bebida'}</span>
                          <span className="whitespace-nowrap">R$ {(Number(item.preco_unitario) * item.quantidade).toFixed(2).replace('.', ',')}</span>
                        </div>
                        {item.observacao && (
                          <div className="text-[10px] font-bold mt-0.5">[Obs: {item.observacao}]</div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-0.5 text-[11px]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>R$ {Number(selectedOrder.subtotal || 0).toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de Entrega:</span>
                    <span>R$ {Number(selectedOrder.taxa_entrega || 0).toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-black my-1.5"></div>

                <div className="flex justify-between font-black text-sm">
                  <span>TOTAL A PAGAR:</span>
                  <span>R$ {Number(selectedOrder.total || 0).toFixed(2).replace('.', ',')}</span>
                </div>

                <div className="border-t-2 border-black my-1.5"></div>

                <div className="text-[11px] font-bold">
                  PAGAMENTO: {selectedOrder.metodo_pagamento}
                </div>
              </div>
            </div>

            {/* LADO DIREITO: Ações Operacionais */}
            <div className="w-full md:w-1/2 bg-[#0A0F1D] p-5 sm:p-7 flex flex-col relative overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-black text-lg sm:text-xl text-white uppercase tracking-widest">
                  Expedição #{String(selectedOrder.codigo_pedido).padStart(4, '0')}
                </h2>
                <button 
                  onClick={() => setDetailsModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-5 flex-1">
                {/* Status Atual */}
                <div className="space-y-2">
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-widest block">
                    Status do Pedido
                  </label>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                    className="w-full bg-[#101935] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wider text-white focus:outline-none focus:border-[#00E5FF]"
                  >
                    <option value="RECEBIDO">Recebido</option>
                    <option value="PREPARANDO">Preparando</option>
                    <option value="SAIU_ENTREGA">Em Rota (Saiu para Entrega)</option>
                    <option value="ENTREGUE">Entregue</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>

                {/* Motoboy Responsável */}
                <div className="space-y-2">
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-widest block">
                    Motoboy Responsável
                  </label>
                  <select
                    value={selectedOrder.motoboy_id || ''}
                    onChange={(e) => handleMotoboyChange(selectedOrder.id, e.target.value)}
                    className="w-full bg-[#101935] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wider text-white focus:outline-none focus:border-[#00E5FF]"
                  >
                    <option value="">Nenhum</option>
                    {motoboys.map((m) => (
                      <option key={m.id} value={m.id}>{m.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botões Finais */}
              <div className="pt-6 space-y-2.5 mt-auto">
                <button
                  onClick={() => printThermalReceipt(selectedOrder)}
                  className="w-full bg-[#00E5FF] hover:bg-[#00B4D8] text-[#0A0F1D] py-3.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(0,229,255,0.25)]"
                >
                  <Printer size={16} /> Imprimir Comanda (80mm)
                </button>
                <a
                  href={`https://wa.me/55${(selectedOrder.cliente_telefone || '').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-[#10B981] hover:bg-[#059669] text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle size={16} /> Falar com Cliente no WhatsApp
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Orders;
