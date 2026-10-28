import { useState, useEffect } from 'react';
import supabase from '../../supabaseClient';
import { 
  Package, Clock, Truck, CheckCircle2, Printer, Eye, 
  Trash2, Phone, Search, AlertCircle, ShoppingBag, MessageCircle, MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';
import { buildEscPosBuffer, trySilentDirectHardwarePrint, buildThermalPrintDocument, triggerCleanIframePrint } from '../../utils/thermalPrinter';

const Orders = () => {
  const [pedidos, setPedidos] = useState([]);
  const [motoboys, setMotoboys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('pendentes'); // pendentes, concluidos, todos
  const [searchCode, setSearchCode] = useState('');

  // Modal de Detalhes / Expedição
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    fetchOrdersAndMotoboys();
  }, [activeFilter]);

  // Polling silencioso a cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrdersAndMotoboys(true);
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
    const printWindow = window.open('', '_blank', 'width=420,height=680');
    if (printWindow) {
      printWindow.document.write('<html><body style="font-family:sans-serif;padding:20px;text-align:center;background:#070B16;color:#fff;">Preparando comanda térmica 80mm...</body></html>');
    }

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

    // 1. Tenta envio silencioso direto via hardware ESC/POS (WebSerial / WebUSB já autorizado)
    try {
      const escPosBytes = buildEscPosBuffer(pedido, itens);
      const sentDirectly = await trySilentDirectHardwarePrint(escPosBytes);
      if (sentDirectly) {
        if (printWindow) printWindow.close();
        toast.success(`Comanda #${String(pedido.codigo_pedido).padStart(4, '0')} enviada direto para a impressora térmica!`);
        return;
      }
    } catch (err) {
      console.warn('Fallback para spooler térmico visual:', err);
    }

    // 2. Renderiza documento térmico 80mm isolado (com altura dinâmica em mm + seleção dinâmica USB/Serial)
    const htmlDoc = buildThermalPrintDocument(pedido, itens);
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlDoc);
      printWindow.document.close();
    } else {
      triggerCleanIframePrint(htmlDoc);
    }
  };

  const handleDeletePedido = async (id, codigo_pedido) => {
    if (!window.confirm(`Tem certeza que deseja EXCLUIR o pedido #${codigo_pedido}? Esta ação não pode ser desfeita.`)) return;
    
    try {
      await supabase.from('itens_pedido').delete().eq('pedido_id', id);
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
    <div className="space-y-5 w-full max-w-7xl mx-auto">
      
      {/* Top Header: Título à Esquerda + Busca & Pílulas Compactas à Direita */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-display font-black uppercase text-white tracking-widest flex items-center gap-2.5">
            <ShoppingBag size={22} className="text-[#00E5FF] shrink-0" /> GESTÃO DE PEDIDOS
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Controle de expedição, impressão térmica 80mm e motoboys em tempo real.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          {/* Busca Compacta */}
          <div className="relative sm:w-52 lg:w-60">
            <input 
              type="text" 
              placeholder="Buscar #código ou cliente..." 
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="w-full bg-[#101935]/90 border border-white/10 rounded-full px-4 py-2 pl-9 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF] transition-colors"
            />
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>

          {/* Filtros em Pílula Compacta */}
          <div className="flex bg-[#070B16] border border-white/10 rounded-full p-1 text-[10px] font-bold uppercase tracking-widest self-start sm:self-auto">
            {[
              { id: 'pendentes', label: 'Ativos' },
              { id: 'concluidos', label: 'Finalizados' },
              { id: 'todos', label: 'Todos' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap ${
                  activeFilter === f.id
                    ? 'bg-[#00E5FF] text-[#0A0F1D] shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs Operacionais Compactos (4 colunas no Desktop e 2x2 no Mobile) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#101935]/80 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Novos / Recebidos</span>
            <span className="text-xl sm:text-2xl font-display font-black text-[#00E5FF] mt-0.5 block leading-none">{countRecebidos}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center shrink-0">
            <AlertCircle size={16} />
          </div>
        </div>

        <div className="bg-[#101935]/80 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Separando</span>
            <span className="text-xl sm:text-2xl font-display font-black text-amber-400 mt-0.5 block leading-none">{countPreparando}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Clock size={16} />
          </div>
        </div>

        <div className="bg-[#101935]/80 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Em Rota</span>
            <span className="text-xl sm:text-2xl font-display font-black text-indigo-300 mt-0.5 block leading-none">{countEmRota}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-300 flex items-center justify-center shrink-0">
            <Truck size={16} />
          </div>
        </div>

        <div className="bg-[#101935]/80 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Entregues</span>
            <span className="text-xl sm:text-2xl font-display font-black text-emerald-400 mt-0.5 block leading-none">{countFinalizados}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={16} />
          </div>
        </div>
      </div>

      {/* Lista de Pedidos: Tabela Elástica Sem Cortes no Desktop (md+) & Cards no Mobile (<768px) */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-9 h-9 border-4 border-[#00E5FF]/20 border-t-[#00E5FF] rounded-full animate-spin" />
        </div>
      ) : filteredPedidos.length === 0 ? (
        <div className="text-center py-14 bg-[#101935]/60 rounded-2xl border border-white/5 p-6">
          <Package size={36} className="mx-auto text-gray-600 mb-2.5" />
          <h3 className="text-white font-bold text-sm">Nenhum pedido encontrado</h3>
          <p className="text-xs text-gray-400 mt-0.5">Não há pedidos para o filtro selecionado no momento.</p>
        </div>
      ) : (
        <>
          {/* VISÃO DESKTOP & NOTEBOOK (md+ 768px+): Grid/Tabela 100% Contida sem cortar botões à direita */}
          <div className="hidden md:block bg-[#101935]/90 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full table-fixed text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-[#070B16]/60 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3 w-[82px] font-medium">Pedido</th>
                  <th className="py-3 px-3 w-[22%] lg:w-[20%] font-medium">Cliente</th>
                  <th className="py-3 px-3 hidden lg:table-cell font-medium">Bairro / Destino</th>
                  <th className="py-3 px-3 w-[95px] font-medium">Total</th>
                  <th className="py-3 px-3 w-[124px] font-medium">Status</th>
                  <th className="py-3 px-3 w-[120px] font-medium">Motoboy</th>
                  <th className="py-3 px-3 w-[142px] xl:w-[172px] font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredPedidos.map((pedido) => {
                  const cod = String(pedido.codigo_pedido).padStart(4, '0');
                  const dataCurta = new Date(pedido.created_at).toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                  });

                  return (
                    <tr 
                      key={pedido.id} 
                      onClick={() => handleOpenDetails(pedido)}
                      className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                    >
                      {/* #Código + Data */}
                      <td className="py-3 px-3 align-middle">
                        <span className="font-display font-black text-white bg-[#0A0F1D] border border-white/10 px-2 py-0.5 rounded-lg text-[11px] inline-block">
                          #{cod}
                        </span>
                        <span className="block text-[10px] text-gray-500 mt-0.5 truncate">
                          {dataCurta}
                        </span>
                      </td>

                      {/* Cliente + Telefone */}
                      <td className="py-3 px-3 align-middle min-w-0">
                        <div className="font-bold text-white text-xs leading-snug truncate" title={pedido.cliente_nome}>
                          {pedido.cliente_nome}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5 truncate">
                          {pedido.cliente_telefone}
                          <span className="lg:hidden text-[#00E5FF] font-semibold"> • {pedido.bairro}</span>
                        </div>
                      </td>

                      {/* Bairro / Destino (Coluna elástica que absorve a diferença de largura entre Notebooks e Monitores Full HD) */}
                      <td className="py-3 px-3 align-middle hidden lg:table-cell min-w-0">
                        <span className="text-[11px] font-bold text-gray-200 block truncate">
                          {pedido.bairro}
                        </span>
                        <span className="text-[11px] text-gray-400 truncate block" title={pedido.endereco_completo}>
                          {pedido.endereco_completo}
                        </span>
                      </td>

                      {/* Total + Pagamento */}
                      <td className="py-3 px-3 align-middle">
                        <span className="font-display font-black text-[#00E5FF] text-xs sm:text-sm block leading-tight truncate">
                          R$ {Number(pedido.total || 0).toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block truncate">
                          {pedido.metodo_pagamento}
                        </span>
                      </td>

                      {/* Seletor Status */}
                      <td className="py-3 px-2.5 align-middle" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={pedido.status}
                          onChange={(e) => handleStatusChange(pedido.id, e.target.value)}
                          className={`w-full border rounded-xl px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide focus:outline-none cursor-pointer ${getStatusBadgeStyle(pedido.status)} bg-[#0A0F1D]`}
                        >
                          <option value="RECEBIDO" className="bg-[#0A0F1D] text-white">Recebido</option>
                          <option value="PREPARANDO" className="bg-[#0A0F1D] text-white">Preparando</option>
                          <option value="SAIU_ENTREGA" className="bg-[#0A0F1D] text-white">Em Rota</option>
                          <option value="ENTREGUE" className="bg-[#0A0F1D] text-white">Entregue</option>
                          <option value="CANCELADO" className="bg-[#0A0F1D] text-white">Cancelado</option>
                        </select>
                      </td>

                      {/* Seletor Motoboy */}
                      <td className="py-3 px-2.5 align-middle" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={pedido.motoboy_id || ''}
                          onChange={(e) => handleMotoboyChange(pedido.id, e.target.value)}
                          className="w-full bg-[#0A0F1D] border border-white/10 rounded-xl px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-200 focus:outline-none focus:border-[#00E5FF] cursor-pointer truncate"
                        >
                          <option value="">Motoboy...</option>
                          {motoboys.map(m => (
                            <option key={m.id} value={m.id}>{m.nome}</option>
                          ))}
                        </select>
                      </td>

                      {/* Botões de Ação (Sempre 100% visíveis dentro da borda direita) */}
                      <td className="py-3 px-3 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => printThermalReceipt(pedido)}
                            className="bg-[#00E5FF]/10 hover:bg-[#00E5FF] text-[#00E5FF] hover:text-[#0A0F1D] border border-[#00E5FF]/40 px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all inline-flex items-center gap-1 shrink-0"
                            title="Imprimir Comanda 80mm"
                          >
                            <Printer size={13} />
                            <span className="hidden xl:inline">Imprimir</span>
                          </button>
                          <button
                            onClick={() => handleOpenDetails(pedido)}
                            className="bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 p-1.5 rounded-xl transition-colors shrink-0"
                            title="Ver Detalhes"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleDeletePedido(pedido.id, pedido.codigo_pedido)}
                            className="bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 p-1.5 rounded-xl transition-colors shrink-0"
                            title="Excluir Pedido"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* VISÃO MOBILE (< 768px): Cards Compactos para Smartphones */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
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
                  className="bg-[#101935]/90 border border-white/10 rounded-2xl p-3.5 flex flex-col gap-3 shadow-md active:scale-[0.99] transition-all"
                >
                  {/* Linha 1: Pedido + Cliente + Total */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-display font-black text-xs text-white bg-[#0A0F1D] border border-white/10 px-2.5 py-1 rounded-lg shrink-0">
                        #{cod}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-bold text-white text-sm truncate">{pedido.cliente_nome}</h3>
                        <span className="text-[10px] text-gray-400 block">{dataCurta}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-display font-black text-sm text-[#00E5FF] block">
                        R$ {Number(pedido.total || 0).toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                        {pedido.metodo_pagamento}
                      </span>
                    </div>
                  </div>

                  {/* Linha 2: Bairro + Endereço Resumido */}
                  <div className="bg-[#0A0F1D]/60 border border-white/5 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase text-[#00E5FF] flex items-center gap-1">
                        <MapPin size={10} /> {pedido.bairro}
                      </span>
                      <p className="text-[11px] text-gray-300 truncate mt-0.5">
                        {pedido.endereco_completo}
                      </p>
                    </div>
                    {foneLimpo && (
                      <a
                        href={`https://wa.me/55${foneLimpo}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1"
                      >
                        <Phone size={11} /> WhatsApp
                      </a>
                    )}
                  </div>

                  {/* Linha 3: Status e Motoboy */}
                  <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={pedido.status}
                      onChange={(e) => handleStatusChange(pedido.id, e.target.value)}
                      className={`w-full border rounded-xl px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider focus:outline-none ${getStatusBadgeStyle(pedido.status)} bg-[#0A0F1D]`}
                    >
                      <option value="RECEBIDO" className="bg-[#0A0F1D] text-white">Recebido</option>
                      <option value="PREPARANDO" className="bg-[#0A0F1D] text-white">Preparando</option>
                      <option value="SAIU_ENTREGA" className="bg-[#0A0F1D] text-white">Em Rota</option>
                      <option value="ENTREGUE" className="bg-[#0A0F1D] text-white">Entregue</option>
                      <option value="CANCELADO" className="bg-[#0A0F1D] text-white">Cancelado</option>
                    </select>

                    <select
                      value={pedido.motoboy_id || ''}
                      onChange={(e) => handleMotoboyChange(pedido.id, e.target.value)}
                      className="w-full bg-[#0A0F1D] border border-white/10 rounded-xl px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider text-white focus:outline-none"
                    >
                      <option value="">Motoboy...</option>
                      {motoboys.map(m => (
                        <option key={m.id} value={m.id}>{m.nome}</option>
                      ))}
                    </select>
                  </div>

                  {/* Linha 4: Botões de Ação */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => printThermalReceipt(pedido)}
                      className="flex-1 bg-[#00E5FF] text-[#0A0F1D] py-2 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
                    >
                      <Printer size={14} /> Imprimir 80mm
                    </button>
                    <button
                      onClick={() => handleOpenDetails(pedido)}
                      className="bg-white/5 border border-white/10 text-gray-200 p-2 rounded-xl"
                      title="Detalhes"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => handleDeletePedido(pedido.id, pedido.codigo_pedido)}
                      className="bg-red-500/10 border border-red-500/30 text-red-400 p-2 rounded-xl"
                      title="Excluir"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* MODAL DETALHES DO PEDIDO (Lado a Lado em sm+ / Desktop e Empilhado apenas em Smartphones) */}
      {detailsModalOpen && selectedOrder && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setDetailsModalOpen(false)}
        >
          <div 
            className="bg-[#101935] rounded-3xl max-w-3xl w-full flex flex-col sm:flex-row overflow-hidden border border-white/10 max-h-[90vh] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* COLUNA ESQUERDA: Simulação Fiel da Comanda 80mm */}
            <div className="w-full sm:w-[320px] shrink-0 bg-[#070B16] p-4 sm:p-5 flex flex-col items-center justify-start overflow-y-auto border-b sm:border-b-0 sm:border-r border-white/10">
              <div className="w-full max-w-[280px] mb-2.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00E5FF]"></span> Preview 80mm
                </span>
                <span>72mm Úteis</span>
              </div>

              <div className="bg-white p-3.5 shadow-xl text-black font-mono text-[11px] leading-snug w-full max-w-[280px] rounded-sm">
                <div className="text-center">
                  <div className="font-black text-xs tracking-tight">REFRESCA BEBIDAS</div>
                  <div className="text-[9px] font-bold">DISTRIBUIDORA & DEPÓSITO</div>
                  <div className="text-[9px]">Rua São Tillon, 141 - Barra da Tijuca</div>
                  <div className="text-[9px]">WhatsApp: (21) 98378-5928</div>
                </div>

                <div className="border-t-2 border-black my-1.5"></div>

                <div className="flex justify-between items-baseline">
                  <span className="font-black text-[11px]">PEDIDO: #{String(selectedOrder.codigo_pedido).padStart(4, '0')}</span>
                  <span className="text-[9px]">{new Date(selectedOrder.created_at).toLocaleString('pt-BR')}</span>
                </div>

                <div className="border-t border-dashed border-black my-1.5"></div>

                <div className="space-y-0.5 text-[10px]">
                  <p><strong>CLIENTE:</strong> {selectedOrder.cliente_nome}</p>
                  <p><strong>TEL:</strong> {selectedOrder.cliente_telefone}</p>
                  <p><strong>ENDEREÇO:</strong> {selectedOrder.endereco_completo}</p>
                  <p><strong>BAIRRO:</strong> {selectedOrder.bairro}</p>
                </div>

                <div className="border-t-2 border-black my-1.5"></div>

                <div className="mb-1.5">
                  <div className="flex justify-between font-black text-[9px] border-b border-black pb-0.5 mb-1">
                    <span>QTD / DESCRIÇÃO</span>
                    <span>TOTAL</span>
                  </div>
                  {loadingItems ? (
                    <p className="text-gray-500 py-2 text-center text-[10px]">Carregando itens...</p>
                  ) : (
                    orderItems.map((item, idx) => (
                      <div key={idx} className="py-0.5 border-b border-dashed border-black/30 text-[10px]">
                        <div className="flex justify-between items-start font-bold">
                          <span className="pr-2">{item.quantidade}x {item.produtos?.nome || 'Bebida'}</span>
                          <span className="whitespace-nowrap">R$ {(Number(item.preco_unitario) * item.quantidade).toFixed(2).replace('.', ',')}</span>
                        </div>
                        {item.observacao && (
                          <div className="text-[9px] font-bold mt-0.5">[Obs: {item.observacao}]</div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-0.5 text-[10px]">
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

                <div className="flex justify-between font-black text-xs">
                  <span>TOTAL A PAGAR:</span>
                  <span>R$ {Number(selectedOrder.total || 0).toFixed(2).replace('.', ',')}</span>
                </div>

                <div className="border-t-2 border-black my-1.5"></div>

                <div className="text-[10px] font-bold">
                  PAGAMENTO: {selectedOrder.metodo_pagamento}
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA: Controles de Expedição */}
            <div className="flex-1 bg-[#0A0F1D] p-5 sm:p-6 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#00E5FF] block">Painel de Despacho</span>
                    <h2 className="font-display font-black text-lg text-white uppercase tracking-wider">
                      Expedição #{String(selectedOrder.codigo_pedido).padStart(4, '0')}
                    </h2>
                  </div>
                  <button 
                    onClick={() => setDetailsModalOpen(false)}
                    className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Status Atual */}
                  <div className="space-y-1.5">
                    <label className="text-gray-400 text-[10px] font-bold uppercase tracking-widest block">
                      Status do Pedido
                    </label>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                      className="w-full bg-[#101935] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-white focus:outline-none focus:border-[#00E5FF]"
                    >
                      <option value="RECEBIDO">Recebido</option>
                      <option value="PREPARANDO">Preparando</option>
                      <option value="SAIU_ENTREGA">Em Rota (Saiu para Entrega)</option>
                      <option value="ENTREGUE">Entregue</option>
                      <option value="CANCELADO">Cancelado</option>
                    </select>
                  </div>

                  {/* Motoboy Responsável */}
                  <div className="space-y-1.5">
                    <label className="text-gray-400 text-[10px] font-bold uppercase tracking-widest block">
                      Motoboy Responsável
                    </label>
                    <select
                      value={selectedOrder.motoboy_id || ''}
                      onChange={(e) => handleMotoboyChange(selectedOrder.id, e.target.value)}
                      className="w-full bg-[#101935] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-white focus:outline-none focus:border-[#00E5FF]"
                    >
                      <option value="">Nenhum</option>
                      {motoboys.map((m) => (
                        <option key={m.id} value={m.id}>{m.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="pt-5 space-y-2.5 mt-4 border-t border-white/5">
                <button
                  onClick={() => printThermalReceipt(selectedOrder)}
                  className="w-full bg-[#00E5FF] hover:bg-[#00B4D8] text-[#0A0F1D] py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors shadow-lg shadow-cyan-500/20"
                >
                  <Printer size={15} /> Imprimir Comanda (80mm)
                </button>
                <a
                  href={`https://wa.me/55${(selectedOrder.cliente_telefone || '').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-[#10B981] hover:bg-[#059669] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle size={15} /> Falar com Cliente no WhatsApp
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
