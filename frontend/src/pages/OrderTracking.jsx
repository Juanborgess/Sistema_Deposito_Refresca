import React, { useState, useEffect } from 'react';
import { Search, Package, Clock, Truck, CheckCircle2, ChevronLeft, Phone, Moon, MessageCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../services/api';

const OrderTracking = () => {
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get('codigo') || '';
  const [orderCode, setOrderCode] = useState(initialCode);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingWaUrl, setPendingWaUrl] = useState(null);

  const performSearch = async (code) => {
    if (!code.trim()) return;

    setLoading(true);
    setError('');
    setOrderData(null);

    try {
      const rawCode = code.trim();
      const response = await api.get(`/track/${rawCode}`);
      setOrderData(response.data);
    } catch (err) {
      setError('Pedido não encontrado. Verifique o código e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      performSearch(initialCode);
    }
  }, [initialCode]);

  // Checa se veio do carrinho de compras precisando abrir o WhatsApp (Bypass de Popup)
  useEffect(() => {
    const waUrl = sessionStorage.getItem('wa_redirect');
    if (waUrl) {
      sessionStorage.removeItem('wa_redirect');
      setPendingWaUrl(waUrl);
    }
  }, []);

  const openWhatsApp = () => {
    if (pendingWaUrl) {
      window.open(pendingWaUrl, '_blank');
      setPendingWaUrl(null);
    }
  };

  // Atualização em Tempo Real (Polling)
  useEffect(() => {
    let intervalId;
    
    // Só atualiza se tiver um pedido ativo e ele não estiver finalizado
    if (orderData && orderData.status !== 'ENTREGUE' && orderData.status !== 'CANCELADO') {
      intervalId = setInterval(() => {
        api.get(`/track/${orderData.codigo_pedido}`)
          .then(res => setOrderData(res.data))
          .catch(err => console.error('Erro na atualização em tempo real:', err));
      }, 10000); // 10 segundos
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [orderData?.codigo_pedido, orderData?.status]);

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch(orderCode);
  };

  const getStatusIndex = (status) => {
    switch (status) {
      case 'RECEBIDO': return 0;
      case 'PREPARANDO': return 1;
      case 'SAIU_ENTREGA': return 2;
      case 'ENTREGUE': return 3;
      case 'CANCELADO': return -1;
      default: return 0;
    }
  };

  const statusSteps = [
    { id: 'RECEBIDO', label: 'Pedido Recebido', desc: 'Aguardando confirmação', icon: <Package size={22} /> },
    { id: 'PREPARANDO', label: 'Separando Bebidas', desc: 'Bebidas no gelo', icon: <Clock size={22} /> },
    { id: 'SAIU_ENTREGA', label: 'Saiu p/ Entrega', desc: 'Motoboy a caminho', icon: <Truck size={22} /> },
    { id: 'ENTREGUE', label: 'Entregue', desc: 'Bebida na sua mão!', icon: <CheckCircle2 size={22} /> }
  ];

  const currentStepIndex = orderData ? getStatusIndex(orderData.status) : 0;

  return (
    <div className="min-h-screen bg-[#0A0F1D] pt-24 pb-16 flex flex-col items-center px-4">
      <Helmet>
        <title>Rastreio de Pedido | Refresca Bebidas</title>
      </Helmet>

      <div className="w-full max-w-2xl">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-[#00E5FF] transition-colors mb-8 text-xs font-bold uppercase tracking-wider"
        >
          <ChevronLeft size={16} /> Voltar para o Catálogo
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-black uppercase tracking-wider text-white mb-3">
            Rastreio de <span className="text-[#00E5FF]">Pedido</span>
          </h1>
          <p className="text-gray-400 text-sm">
            Acompanhe o status da entrega da sua bebida em tempo real.
          </p>
        </div>

        {/* Formulário de Busca */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative flex items-center">
            <input
              type="text"
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value)}
              placeholder="Digite o código (ex: 12 ou REF-123)"
              className="w-full bg-[#101935] border-2 border-white/10 rounded-2xl py-4 pl-6 pr-16 text-white text-base font-bold font-display uppercase tracking-wider focus:outline-none focus:border-[#00E5FF] transition-colors placeholder:text-gray-600"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-3 bg-[#00E5FF] text-[#0A0F1D] p-3 rounded-xl hover:bg-cyan-400 transition-colors disabled:opacity-50"
            >
              <Search size={22} />
            </button>
          </div>
          {error && <p className="text-red-400 text-xs font-bold mt-3 text-center">{error}</p>}
        </form>

        {loading && (
          <div className="flex justify-center my-12">
            <div className="w-10 h-10 border-4 border-[#00E5FF]/20 border-t-[#00E5FF] rounded-full animate-spin"></div>
          </div>
        )}

        {/* DETALHES DO PEDIDO ENCONTRADO */}
        {orderData && (
          <div className="bg-[#101935] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden space-y-6">
            
            {/* Aviso de Pedido Agendado */}
            {orderData.is_agendado && (
              <div className="bg-[#FFDE59]/15 border border-[#FFDE59]/40 rounded-2xl p-4 flex items-center gap-3 text-xs text-[#FFDE59]">
                <Moon size={22} className="shrink-0 text-[#FFDE59]" />
                <div>
                  <span className="font-bold uppercase tracking-wider block text-sm">Pedido Agendado</span>
                  <span>Este pedido foi registrado fora do horário de expediente e será despachado assim que abrirmos às 08h.</span>
                </div>
              </div>
            )}

            {/* Cabeçalho do Card */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-6 border-b border-white/10 gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-gray-500 font-bold block">Código do Pedido</span>
                <span className="font-display font-black text-2xl text-white tracking-wider">
                  #{String(orderData.codigo_pedido).padStart(4, '0')}
                </span>
              </div>
              <div className="sm:text-right">
                <span className="text-xs uppercase tracking-widest text-gray-500 font-bold block">Status Atual</span>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mt-1 ${
                  orderData.status === 'CANCELADO' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                  orderData.status === 'ENTREGUE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 animate-pulse'
                }`}>
                  {orderData.status === 'RECEBIDO' ? 'Recebido' :
                   orderData.status === 'PREPARANDO' ? 'Em Separação' :
                   orderData.status === 'SAIU_ENTREGA' ? 'Saiu para Entrega' :
                   orderData.status === 'ENTREGUE' ? 'Entregue' : 'Cancelado'}
                </span>
              </div>
            </div>

            {/* Linha do Tempo / Timeline */}
            {orderData.status !== 'CANCELADO' ? (
              <div className="py-4">
                <div className="grid grid-cols-4 gap-2 relative">
                  {statusSteps.map((step, idx) => {
                    const isDone = currentStepIndex >= idx;
                    const isCurrent = currentStepIndex === idx;

                    return (
                      <div key={step.id} className="flex flex-col items-center text-center">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                          isDone 
                            ? 'bg-[#00E5FF] text-[#0A0F1D] shadow-lg shadow-cyan-500/20' 
                            : 'bg-[#0A0F1D] text-gray-600 border border-white/10'
                        } ${isCurrent ? 'ring-4 ring-[#00E5FF]/30 scale-105' : ''}`}>
                          {step.icon}
                        </div>
                        <span className={`text-xs font-bold mt-2.5 leading-tight ${
                          isDone ? 'text-white' : 'text-gray-500'
                        }`}>
                          {step.label}
                        </span>
                        <span className="text-[10px] text-gray-500 hidden sm:block mt-0.5">
                          {step.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-center text-red-400 text-sm font-medium">
                Este pedido foi cancelado. Caso tenha dúvidas, entre em contato pelo nosso WhatsApp.
              </div>
            )}

            {/* Dados do Motoboy (Se Saiu para Entrega) */}
            {orderData.motoboys && orderData.status === 'SAIU_ENTREGA' && (
              <div className="bg-[#0A0F1D] border border-[#00E5FF]/30 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#00E5FF]/20 text-[#00E5FF] flex items-center justify-center">
                    <Truck size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 uppercase font-bold tracking-wider block">Entregador em Rota:</span>
                    <span className="text-sm font-bold text-white">{orderData.motoboys.nome}</span>
                  </div>
                </div>
                {orderData.motoboys.telefone && (
                  <a
                    href={`https://wa.me/55${orderData.motoboys.telefone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 bg-[#25D366] text-black font-bold text-xs px-3 py-2 rounded-xl"
                  >
                    <Phone size={14} /> Contatar
                  </a>
                )}
              </div>
            )}

            {/* Informações de Endereço e Valores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs">
              <div className="space-y-1">
                <span className="text-gray-500 uppercase font-bold">Endereço de Entrega</span>
                <p className="text-gray-200">{orderData.endereco_completo}</p>
                <p className="text-[#00E5FF] font-semibold">{orderData.bairro}</p>
              </div>
              <div className="space-y-1 md:text-right">
                <span className="text-gray-500 uppercase font-bold">Resumo Financeiro</span>
                <p className="text-gray-300">Pagamento: <strong className="text-white">{orderData.metodo_pagamento}</strong></p>
                <p className="text-gray-300">Taxa de Frete: <strong>R$ {Number(orderData.taxa_entrega || 0).toFixed(2).replace('.', ',')}</strong></p>
                <p className="text-base font-display font-black text-[#00E5FF] pt-1">
                  Total: R$ {Number(orderData.total || 0).toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Modal de Finalização do WhatsApp */}
      {pendingWaUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#101935] border border-white/10 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-[#25D366]/20 text-[#25D366] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(37,211,102,0.3)]">
              <MessageCircle size={40} />
            </div>
            <h3 className="font-display font-black text-2xl text-white mb-2 uppercase tracking-wider">Quase lá!</h3>
            <p className="text-sm text-gray-300 mb-8 leading-relaxed">
              Seu pedido já foi salvo no sistema. Para iniciarmos o preparo, você precisa nos enviar a mensagem com os detalhes no WhatsApp.
            </p>
            <button
              onClick={openWhatsApp}
              className="w-full bg-[#25D366] text-black py-4 rounded-2xl font-black uppercase tracking-wider hover:bg-[#20bd5a] hover:scale-105 transition-all duration-300 shadow-[0_0_15px_rgba(37,211,102,0.4)] mb-4"
            >
              Mandar no WhatsApp
            </button>
            <button
              onClick={() => setPendingWaUrl(null)}
              className="w-full text-gray-500 text-xs uppercase font-bold hover:text-white transition-colors"
            >
              Fechar (Já Enviei)
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderTracking;
