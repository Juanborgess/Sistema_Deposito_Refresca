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
    // Busca itens caso não tenha
    let itens = [];
    try {
      const { data } = await supabase
        .from('itens_pedido')
        .select('*, produtos(nome)')
        .eq('pedido_id', pedido.id);
      itens = data || [];
    } catch (e) {
      console.error(e);
    }

    const printWindow = window.open('', '_blank', 'width=350,height=600');
    if (!printWindow) {
      toast.error('Permita popups para imprimir a comanda.');
      return;
    }

    const itemsHtml = itens.map(i => `
      <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:12px;">
        <span>${i.quantidade}x ${i.produtos ? i.produtos.nome : 'Item'}</span>
        <span>R$ ${(Number(i.preco_unitario) * i.quantidade).toFixed(2).replace('.', ',')}</span>
      </div>
      ${i.observacao ? `<div style="font-size:10px; color:#555; margin-bottom:4px;">Obs: ${i.observacao}</div>` : ''}
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Comanda #${pedido.codigo_pedido}</title>
          <style>
            body { font-family: monospace; padding: 10px; font-size: 12px; color: #000; }
            .center { text-align: center; }
            .line { border-top: 1px dashed #000; margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="center">
            <strong>DISTRIBUIDORA DE BEBIDAS REFRESCA</strong><br/>
            Rua São Tillon, 141 - Barra da Tijuca<br/>
            Tel/Zap: (21) 98378-5928<br/>
          </div>
          <div class="line"></div>
          <div>
            <strong>PEDIDO #${pedido.codigo_pedido}</strong><br/>
            Data: ${new Date(pedido.created_at).toLocaleString('pt-BR')}<br/>
            Cliente: ${pedido.cliente_nome}<br/>
            Tel: ${pedido.cliente_telefone}<br/>
            Endereço: ${pedido.endereco_completo}<br/>
            Bairro: ${pedido.bairro}<br/>
            ${pedido.is_agendado ? '<strong>*** PEDIDO AGENDADO ***</strong><br/>' : ''}
          </div>
          <div class="line"></div>
          <div><strong>ITENS:</strong></div>
          ${itemsHtml}
          <div class="line"></div>
          <div style="display:flex; justify-content:space-between;">
            <span>Subtotal:</span>
            <span>R$ ${Number(pedido.subtotal || 0).toFixed(2).replace('.', ',')}</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>Frete:</span>
            <span>R$ ${Number(pedido.taxa_entrega || 0).toFixed(2).replace('.', ',')}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:14px; margin-top:4px;">
            <span>TOTAL:</span>
            <span>R$ ${Number(pedido.total || 0).toFixed(2).replace('.', ',')}</span>
          </div>
          <div class="line"></div>
          <div>Pagamento: ${pedido.metodo_pagamento}</div>
          <div class="center" style="margin-top:15px; font-size:10px;">
            Agradecemos a preferência! Bebida gelada é com o Refresca.
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
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

  const filteredPedidos = pedidos.filter(p => {
    if (!searchCode) return true;
    return String(p.codigo_pedido).includes(searchCode) || p.cliente_nome.toLowerCase().includes(searchCode.toLowerCase());
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header com Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black uppercase text-white tracking-wider flex items-center gap-3">
            <ShoppingBag className="text-[#00E5FF]" /> Gestão de Pedidos
          </h1>
          <p className="text-xs text-gray-400">Controle de expedição, entrega e motoboys em tempo real.</p>
        </div>

        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
          <div className="relative w-full md:w-auto">
            <input 
              type="text" 
              placeholder="Buscar por código ou cliente..." 
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="w-full bg-[#101935] border border-white/10 rounded-xl px-4 py-2.5 pl-9 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF]"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>

          <div className="flex bg-[#101935] border border-white/10 rounded-xl p-1 text-[10px] md:text-xs overflow-x-auto">
            {['pendentes', 'concluidos', 'todos'].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`flex-1 md:flex-none px-3 py-2 md:py-1.5 rounded-lg font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                  activeFilter === f ? 'bg-[#00E5FF] text-[#0A0F1D]' : 'text-gray-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Pedidos - Layout de Tabela Vaiper */}
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
        <div className="bg-[#101935] border border-white/5 rounded-2xl overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-white/5 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                <th className="p-5 font-medium">Cod</th>
                <th className="p-5 font-medium">Cliente</th>
                <th className="p-5 font-medium">Bairro</th>
                <th className="p-5 font-medium">Total / Pgto</th>
                <th className="p-5 font-medium">Status</th>
                <th className="p-5 font-medium">Motoboy</th>
                <th className="p-5 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPedidos.map((pedido) => (
                <tr 
                  key={pedido.id} 
                  className="hover:bg-white/5 transition-colors group cursor-pointer"
                  onClick={() => handleOpenDetails(pedido)}
                >
                  <td className="p-5 align-top">
                    <span className="font-display font-black text-white">
                      #{String(pedido.codigo_pedido).padStart(4, '0')}
                    </span>
                  </td>
                  <td className="p-5 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-white text-sm">
                        {pedido.cliente_nome}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {new Date(pedido.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {pedido.cliente_telefone}
                      </span>
                    </div>
                  </td>
                  <td className="p-5 align-top">
                    <span className="text-[11px] text-gray-400">{pedido.bairro}</span>
                  </td>
                  <td className="p-5 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-[#00E5FF] text-sm">
                        R$ {Number(pedido.total || 0).toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                        {pedido.metodo_pagamento}
                      </span>
                    </div>
                  </td>
                  <td className="p-5 align-top">
                    <select
                      value={pedido.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleStatusChange(pedido.id, e.target.value);
                      }}
                      className="bg-[#0A0F1D] border border-white/10 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white focus:outline-none focus:border-[#00E5FF]"
                    >
                      <option value="RECEBIDO">Recebido</option>
                      <option value="PREPARANDO">Preparando</option>
                      <option value="SAIU_ENTREGA">Em Rota</option>
                      <option value="ENTREGUE">Entregue</option>
                      <option value="CANCELADO">Cancelado</option>
                    </select>
                  </td>
                  <td className="p-5 align-top">
                    <select
                      value={pedido.motoboy_id || ''}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleMotoboyChange(pedido.id, e.target.value);
                      }}
                      className="bg-[#0A0F1D] border border-white/10 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white focus:outline-none focus:border-[#00E5FF] min-w-[120px]"
                    >
                      <option value="">Selecione...</option>
                      {motoboys.map(m => (
                        <option key={m.id} value={m.id}>{m.nome}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-5 align-top">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); printThermalReceipt(pedido); }}
                        className="bg-transparent border border-[#00E5FF]/30 hover:bg-[#00E5FF]/10 text-[#00E5FF] px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5"
                      >
                        <Printer size={12} /> Imprimir
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenDetails(pedido); }}
                        className="bg-transparent border border-white/10 hover:bg-white/10 text-gray-300 p-1.5 rounded-lg transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeletePedido(pedido.id, pedido.codigo_pedido); }}
                        className="bg-transparent border border-red-500/30 hover:bg-red-500/10 text-red-500 p-1.5 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DETALHES DO PEDIDO (DIVIDIDO) */}
      {detailsModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-[#101935] rounded-3xl max-w-4xl w-full flex flex-col md:flex-row overflow-hidden border border-white/10 max-h-[90vh]">
            
            {/* LADO ESQUERDO: Recibo Térmico */}
            <div className="w-full md:w-1/2 bg-[#E5E7EB] p-6 md:p-8 flex items-center justify-center overflow-y-auto">
              <div className="bg-white p-6 shadow-2xl text-black font-mono text-[11px] leading-tight w-full max-w-sm">
                <div className="text-center mb-4">
                  <h2 className="font-bold text-sm">DISTRIBUIDORA DE BEBIDAS REFRESCA</h2>
                  <p>Rio de Janeiro - RJ</p>
                </div>
                <div className="border-t border-dashed border-black my-2"></div>
                
                <div className="mb-2">
                  <p><strong>PEDIDO #{selectedOrder.codigo_pedido}</strong></p>
                  <p>Data: {new Date(selectedOrder.created_at).toLocaleString('pt-BR')}</p>
                </div>
                
                <div className="mb-2">
                  <p><strong>DADOS DO CLIENTE:</strong></p>
                  <p>Nome: {selectedOrder.cliente_nome}</p>
                  <p>Tel: {selectedOrder.cliente_telefone}</p>
                  <p className="mt-1">Endereço: {selectedOrder.endereco_completo}</p>
                  <p>Bairro: {selectedOrder.bairro}</p>
                </div>
                <div className="border-t border-dashed border-black my-2"></div>
                
                <div className="mb-2">
                  <p><strong>ITENS DO PEDIDO:</strong></p>
                  <div className="flex justify-between font-bold mb-1">
                    <span>Qtd Item</span>
                    <span>R$</span>
                  </div>
                  {loadingItems ? (
                    <p className="text-gray-500">Carregando...</p>
                  ) : (
                    orderItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start mb-1">
                        <span className="pr-2">{item.quantidade}x {item.produtos?.nome || 'Bebida'}</span>
                        <span>{(Number(item.preco_unitario) * item.quantidade).toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="border-t border-dashed border-black my-2"></div>
                <div className="flex justify-between mb-1">
                  <span>Subtotal:</span>
                  <span>R$ {Number(selectedOrder.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Taxa Entrega:</span>
                  <span>R$ {Number(selectedOrder.taxa_entrega || 0).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between font-bold text-sm mb-2">
                  <span>TOTAL:</span>
                  <span>R$ {Number(selectedOrder.total || 0).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Forma de Pgto:</span>
                  <span>{selectedOrder.metodo_pagamento}</span>
                </div>
              </div>
            </div>

            {/* LADO DIREITO: Ações */}
            <div className="w-full md:w-1/2 bg-[#0A0F1D] p-6 md:p-8 flex flex-col relative overflow-y-auto">
              <button 
                onClick={() => setDetailsModalOpen(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
              >
                ✕
              </button>

              <h2 className="font-display font-black text-xl text-white uppercase tracking-widest mb-8">Ações do Pedido</h2>
              
              <div className="space-y-6 flex-1">
                {/* Status Atual */}
                <div className="space-y-2">
                  <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block">
                    Status Atual
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
                  <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block">
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
              <div className="pt-8 space-y-3 mt-auto">
                <a
                  href={`https://wa.me/55${selectedOrder.cliente_telefone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-[#10B981] hover:bg-[#059669] text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle size={16} /> Falar com Cliente
                </a>
                <button
                  onClick={() => printThermalReceipt(selectedOrder)}
                  className="w-full bg-[#00E5FF] hover:bg-[#00B4D8] text-[#0A0F1D] py-3.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(0,229,255,0.3)] hover:shadow-[0_0_25px_rgba(0,229,255,0.5)]"
                >
                  <Printer size={16} /> Imprimir Comanda
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Orders;
