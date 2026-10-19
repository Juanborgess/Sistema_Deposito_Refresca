import React, { useState, useEffect } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, ArrowLeft, MapPin, CreditCard, User, Send, Clock, Sparkles } from 'lucide-react';
import useCartStore from '../store/cartStore';
import { useThemeStore } from '../store/useThemeStore';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const WHATSAPP_NUMBER = "5521983785928";

const Cart = () => {
  const { items, isOpen, closeCart, updateQuantity, removeItem, getSubtotal, clearCart } = useCartStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  // Estados do Checkout
  const [isCheckoutMode, setIsCheckoutMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    cep: '',
    bairro: '',
    endereco: '',
    complemento: '',
    pagamento: 'PIX',
    troco: ''
  });
  const [cepLoading, setCepLoading] = useState(false);

  // Estados de Cupom
  const [cupomInput, setCupomInput] = useState('');
  const [cupomAtivo, setCupomAtivo] = useState(null);
  const [cupomLoading, setCupomLoading] = useState(false);
  const [cupomError, setCupomError] = useState('');

  const [bairrosOrdenados, setBairrosOrdenados] = useState([]);
  const [storeConfig, setStoreConfig] = useState(null);
  const [isStoreOpen, setIsStoreOpen] = useState(true);

  // Cálculos Financeiros e Pedido Mínimo Dinâmico
  const subtotal = getSubtotal();
  const minimumOrderValue = storeConfig && storeConfig.pedido_minimo !== undefined && storeConfig.pedido_minimo !== null
    ? Math.max(0, Number(storeConfig.pedido_minimo))
    : 30.00;
  const hasMinimum = minimumOrderValue > 0;
  const isMinimumMet = !hasMinimum || subtotal >= minimumOrderValue;
  const amountToMinimum = hasMinimum ? Math.max(0, minimumOrderValue - subtotal) : 0;
  const progressPercentage = hasMinimum ? Math.min(100, (subtotal / minimumOrderValue) * 100) : 100;

  // Busca configurações e fretes ao iniciar e ao abrir carrinho
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await api.get('/config');
        if (data) setStoreConfig(data);
      } catch (error) {
        console.error('Erro ao buscar config:', error);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    if (isOpen) {
      const fetchFretes = async () => {
        try {
          const { data } = await api.get('/fretes');
          if (data) setBairrosOrdenados(data);
        } catch (error) {
          console.error('Erro ao buscar fretes:', error);
        }
      };
      const fetchConfig = async () => {
        try {
          const { data } = await api.get('/config');
          if (data) setStoreConfig(data);
        } catch (error) {
          console.error('Erro ao buscar config:', error);
        }
      };
      fetchFretes();
      fetchConfig();
    }
  }, [isOpen]);

  useEffect(() => {
    if (storeConfig) {
      const now = new Date();
      const currentDay = now.getDay();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

      // Verifica dias de funcionamento
      const isOpenDay = (storeConfig.dias_funcionamento || [0,1,2,3,4,5,6]).includes(currentDay);
      
      let isOpenTime = true;
      if (storeConfig.horario_abertura && storeConfig.horario_fechamento) {
        const abre = storeConfig.horario_abertura.substring(0, 5);
        const fecha = storeConfig.horario_fechamento.substring(0, 5);
        
        if (abre <= fecha) {
          isOpenTime = currentTimeStr >= abre && currentTimeStr <= fecha;
        } else {
          isOpenTime = currentTimeStr >= abre || currentTimeStr <= fecha;
        }
      }

      setIsStoreOpen(isOpenDay && isOpenTime);
    }
  }, [storeConfig, isOpen]);

  // Se o usuário apagar os itens enquanto estiver na tela de checkout, volta pra tela inicial do carrinho
  useEffect(() => {
    if (items.length === 0 && isCheckoutMode) {
      setIsCheckoutMode(false);
    }
  }, [items.length, isCheckoutMode]);

  // Frete selecionado
  const selectedBairroObj = bairrosOrdenados.find(b => b.bairro.toLowerCase() === (formData.bairro || '').toLowerCase());
  const frete = selectedBairroObj ? Number(selectedBairroObj.valor) : 0;
  
  // Cupom de desconto
  const valorDesconto = cupomAtivo ? subtotal * (cupomAtivo.porcentagem_desconto / 100) : 0;
  const totalGeral = subtotal - valorDesconto + frete;

  if (!isOpen && items.length === 0) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCepChange = async (e) => {
    let value = e.target.value.replace(/\D/g, '');
    let masked = value;
    if (value.length > 5) {
      masked = value.replace(/^(\d{5})(\d)/, '$1-$2');
    }
    
    setFormData(prev => ({ ...prev, cep: masked }));

    if (value.length === 8) {
      setCepLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${value}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          const matchedBairro = bairrosOrdenados.find(b => 
            b.bairro.toLowerCase() === (data.bairro || '').toLowerCase()
          );
          
          setFormData(prev => ({
            ...prev,
            endereco: data.logradouro || prev.endereco,
            bairro: matchedBairro ? matchedBairro.bairro : (data.bairro || prev.bairro)
          }));

          if (matchedBairro) {
            toast.success(`Taxa de entrega calculada: R$ ${Number(matchedBairro.valor).toFixed(2).replace('.', ',')}`);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      } finally {
        setCepLoading(false);
      }
    }
  };

  const closeAndResetCart = () => {
    setIsCheckoutMode(false);
    closeCart();
  };

  const handleCheckoutClick = () => {
    if (isMinimumMet) setIsCheckoutMode(true);
  };

  const validateCoupon = async () => {
    if (!cupomInput.trim()) return;
    setCupomLoading(true);
    setCupomError('');
    try {
      const response = await api.get(`/coupons/validate?code=${cupomInput.trim().toUpperCase()}`);
      setCupomAtivo(response.data);
      setCupomInput('');
      toast.success('Cupom aplicado com sucesso!');
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Cupom inválido ou expirado';
      setCupomError(errMsg);
      toast.error(errMsg);
    } finally {
      setCupomLoading(false);
    }
  };

  const removeCoupon = () => {
    setCupomAtivo(null);
    setCupomError('');
    toast('Cupom removido.', { icon: '🗑️' });
  };

  const sendOrderToWhatsApp = async (e) => {
    e.preventDefault();
    if (!isMinimumMet) {
      toast.error(`O pedido mínimo é de R$ ${minimumOrderValue.toFixed(2).replace('.', ',')}`);
      return;
    }
    if (!formData.bairro) {
      toast.error('Por favor, selecione seu bairro de entrega.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 1. Salva o pedido no banco
      const payload = {
        cliente_nome: formData.nome,
        cliente_telefone: formData.telefone || "Não informado",
        bairro: formData.bairro,
        endereco_completo: `${formData.endereco}${formData.complemento ? ' - ' + formData.complemento : ''} (CEP: ${formData.cep})`,
        metodo_pagamento: formData.pagamento,
        subtotal: subtotal,
        taxa_entrega: frete,
        total: totalGeral,
        cupom_aplicado: cupomAtivo ? cupomAtivo.codigo : null,
        is_agendado: !isStoreOpen,
        itens: items.map(item => ({
          produto_id: item.id,
          quantidade: item.quantity,
          preco_unitario: item.valor_final || item.valor,
          variacoes: item.variacoes_selecionadas,
          observacao: item.observacao
        }))
      };

      const { data: orderData } = await api.post('/orders', payload);
      const codigoPedido = orderData.codigo_pedido || "000";

      // 2. Monta mensagem para WhatsApp
      let itemsText = items.map(item => {
        let txt = `• ${item.quantity}x ${item.nome} - R$ ${((item.valor_final || item.valor) * item.quantity).toFixed(2).replace('.', ',')}`;
        if (item.variacoes_selecionadas && item.variacoes_selecionadas.length > 0) {
          item.variacoes_selecionadas.forEach(v => {
            txt += `\n   [${v.grupo_nome}]: ${v.opcoes.map(o => o.nome).join(', ')}`;
          });
        }
        if (item.observacao) {
          txt += `\n   Obs: ${item.observacao}`;
        }
        return txt;
      }).join('\n\n');
      
      let text = '';
      if (!isStoreOpen) {
        text = `*PEDIDO AGENDADO #${codigoPedido} - DISTRIBUIDORA REFRESCA*\n_(Para entrega assim que abrirmos)_\n\n`;
      } else {
        text = `*NOVO PEDIDO #${codigoPedido} - DISTRIBUIDORA REFRESCA*\n\n`;
      }
      text += `*Cliente:* ${formData.nome}\n`;
      text += `*Bairro:* ${formData.bairro} (Entrega: R$ ${frete.toFixed(2).replace('.', ',')})\n`;
      text += `*Endereço:* ${formData.endereco}${formData.complemento ? ' - ' + formData.complemento : ''} (CEP: ${formData.cep})\n\n`;
      text += `*ITENS DO PEDIDO:*\n${itemsText}\n\n`;
      text += `*RESUMO FINANCEIRO:*\n`;
      text += `Subtotal: R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
      if (valorDesconto > 0) {
        text += `Desconto (${cupomAtivo.codigo}): -R$ ${valorDesconto.toFixed(2).replace('.', ',')}\n`;
      }
      text += `Taxa de Entrega: R$ ${frete.toFixed(2).replace('.', ',')}\n`;
      text += `*TOTAL A PAGAR: R$ ${totalGeral.toFixed(2).replace('.', ',')}*\n\n`;
      let pagamentoFormatado = formData.pagamento;
      if (formData.pagamento === 'CREDITO') {
        pagamentoFormatado = 'Cartão de Crédito (Levar Máquina)';
      } else if (formData.pagamento === 'DEBITO') {
        pagamentoFormatado = 'Cartão de Débito (Levar Máquina)';
      } else if (formData.pagamento === 'PIX') {
        pagamentoFormatado = 'PIX';
      } else if (formData.pagamento === 'DINHEIRO') {
        pagamentoFormatado = 'Dinheiro';
      }

      text += `*Forma de Pagamento:* ${pagamentoFormatado}`;
      if (formData.pagamento === 'DINHEIRO' && formData.troco) {
        text += ` (Troco para R$ ${formData.troco})\n\n`;
      } else if (formData.pagamento === 'PIX') {
        text += `\nChave Pix do Depósito: 21992962260\n\n`;
      } else {
        text += `\n\n`;
      }
      text += `*Acompanhe o Rastreio do seu Pedido:*\n${window.location.origin}/rastreio?codigo=${codigoPedido}`;

      const encodedText = encodeURIComponent(text);
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedText}`;
      
      clearCart();
      closeAndResetCart();
      
      // Salva URL para abrir no rastreio evitando bloqueio de popup em smartphones
      sessionStorage.setItem('wa_redirect', url);
      navigate(`/rastreio?codigo=${codigoPedido}`);
    } catch (error) {
      console.error("Erro ao fechar pedido:", error);
      toast.error("Houve um erro ao processar seu pedido. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[120] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      {/* Backdrop escuro com blur */}
      <div 
        onClick={closeAndResetCart} 
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      />

      {/* Drawer Lateral */}
      <div className={`absolute top-0 right-0 h-full w-full sm:max-w-md md:max-w-lg border-l shadow-2xl flex flex-col transform transition-transform duration-300 ease-out z-10 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } ${
        isDark ? 'bg-[#0A0F1D] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        
        {/* Cabeçalho do Carrinho */}
        <div className={`p-5 border-b flex items-center justify-between ${
          isDark ? 'bg-[#101935] border-white/10' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            {isCheckoutMode ? (
              <button 
                onClick={() => setIsCheckoutMode(false)}
                className={`p-1 transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
                title="Voltar aos itens"
              >
                <ArrowLeft size={22} />
              </button>
            ) : (
              <ShoppingBag className={isDark ? "text-[#00E5FF]" : "text-[#0284C7]"} size={24} />
            )}
            <div>
              <h3 className={`font-display font-black text-lg uppercase tracking-wider ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {isCheckoutMode ? 'Finalizar Pedido' : 'Meu Carrinho'}
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                {items.length} {items.length === 1 ? 'item adicionado' : 'itens adicionados'}
              </p>
            </div>
          </div>
          <button 
            onClick={closeAndResetCart}
            className={`p-2 rounded-full transition-colors ${
              isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
            }`}
          >
            <X size={22} />
          </button>
        </div>

        {/* Alerta de Loja Fechada / Pedido Agendado */}
        {!isStoreOpen && (
          <div className={`border-b p-3 px-5 flex items-center gap-3 text-xs ${
            isDark ? 'bg-[#FFDE59]/15 border-[#FFDE59]/30 text-[#FFDE59]' : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <Clock size={18} className="shrink-0" />
            <div>
              <span className="font-bold uppercase tracking-wider block">Loja Fechada no Momento</span>
              <span>Seu pedido será registrado como <strong>Agendado</strong> e entregue assim que abrirmos às 08h.</span>
            </div>
          </div>
        )}

        {/* Barra de Progresso de Pedido Mínimo */}
        {!isCheckoutMode && items.length > 0 && (
          <div className={`px-5 py-3 border-b ${
            isDark ? 'bg-[#101935]/60 border-white/5' : 'bg-slate-100/70 border-slate-200'
          }`}>
            <div className="flex justify-between text-xs mb-1.5 font-medium">
              <span className={isDark ? "text-gray-300" : "text-slate-600"}>
                {!hasMinimum ? (
                  <span className={`font-bold flex items-center gap-1 ${isDark ? "text-[#00E5FF]" : "text-[#0284C7]"}`}>
                    <Sparkles size={14} /> Sem valor mínimo! Peça o quanto quiser.
                  </span>
                ) : isMinimumMet ? (
                  <span className={`font-bold flex items-center gap-1 ${isDark ? "text-[#00E5FF]" : "text-[#0284C7]"}`}>
                    <Sparkles size={14} /> Pedido mínimo atingido!
                  </span>
                ) : (
                  <span>Faltam <strong>R$ {amountToMinimum.toFixed(2).replace('.', ',')}</strong> para o pedido mínimo</span>
                )}
              </span>
              {hasMinimum && (
                <span className={isDark ? "text-gray-400" : "text-slate-500"}>R$ {minimumOrderValue.toFixed(2).replace('.', ',')}</span>
              )}
            </div>
            {hasMinimum && (
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-black/40' : 'bg-slate-200'}`}>
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    isMinimumMet 
                      ? (isDark ? 'bg-[#00E5FF]' : 'bg-[#0284C7]') 
                      : (isDark ? 'bg-[#FFDE59]' : 'bg-amber-500')
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* CONTEÚDO PRINCIPAL (ITENS OU CHECKOUT) */}
        {!isCheckoutMode ? (
          /* MODO LISTA DE ITENS */
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                    isDark ? 'bg-[#101935] text-gray-500' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <ShoppingBag size={40} className={isDark ? "text-[#00E5FF]/40" : "text-[#0284C7]/60"} />
                  </div>
                  <h4 className={`font-display font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Carrinho Vazio</h4>
                  <p className={`text-sm max-w-xs mb-6 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    Sua cesta está sem bebidas geladas. Escolha suas cervejas, destilados ou gelo!
                  </p>
                  <button
                    onClick={closeAndResetCart}
                    className={`font-bold px-6 py-2.5 rounded-xl text-sm uppercase tracking-wider transition-colors ${
                      isDark 
                        ? 'bg-[#00E5FF] text-[#0A0F1D] hover:bg-cyan-400' 
                        : 'bg-[#0284C7] text-white hover:bg-sky-700'
                    }`}
                  >
                    Ver Catálogo
                  </button>
                </div>
              ) : (
                items.map((item, index) => (
                  <div 
                    key={`${item.cartItemId}-${index}`}
                    className={`flex gap-4 p-3 rounded-2xl relative group border ${
                      isDark ? 'bg-[#101935]/80 border-white/5' : 'bg-slate-50 border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center p-2 shrink-0 border ${
                      isDark ? 'bg-[#0A0F1D] border-white/5' : 'bg-white border-slate-200'
                    }`}>
                      <img 
                        src={item.imagem || item.imagem_url || '/logo_refresca.png'} 
                        alt={item.nome}
                        onError={(e) => { e.target.src = '/logo_refresca.png'; }}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.nome}</h4>
                        <button 
                          onClick={() => removeItem(item.cartItemId)}
                          className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Variações Selecionadas */}
                      {item.variacoes_selecionadas && item.variacoes_selecionadas.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {item.variacoes_selecionadas.map((v, i) => (
                            <p key={i} className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                              <span className={isDark ? "text-gray-300 font-semibold" : "text-slate-700 font-semibold"}>{v.grupo_nome}:</span> {v.opcoes.map(o => o.nome).join(', ')}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Observações */}
                      {item.observacao && (
                        <p className={`text-[11px] italic mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Obs: {item.observacao}</p>
                      )}

                      <div className="flex justify-between items-center mt-3">
                        <span className={`font-bold text-sm ${isDark ? 'text-[#00E5FF]' : 'text-[#0284C7]'}`}>
                          R$ {((item.valor_final || item.valor) * item.quantity).toFixed(2).replace('.', ',')}
                        </span>
                        
                        <div className={`flex items-center gap-2 border rounded-lg px-2 py-0.5 ${
                          isDark ? 'bg-[#0A0F1D] border-white/10' : 'bg-white border-slate-200 shadow-sm'
                        }`}>
                          <button 
                            onClick={() => updateQuantity(item.cartItemId, -1)}
                            className={`px-1 text-base font-bold ${isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
                          >
                            -
                          </button>
                          <span className={`text-xs font-bold w-4 text-center ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.cartItemId, 1)}
                            className={`px-1 text-base font-bold ${isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Rodapé do Carrinho com Subtotal e Botão */}
            {items.length > 0 && (
              <div className={`p-5 border-t space-y-4 ${
                isDark ? 'bg-[#101935] border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex justify-between items-center text-sm">
                  <span className={isDark ? "text-gray-400" : "text-slate-500"}>Subtotal</span>
                  <span className={`font-display font-black text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    R$ {subtotal.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <button
                  onClick={handleCheckoutClick}
                  disabled={!isMinimumMet}
                  className={`w-full py-4 rounded-xl font-display font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                    isMinimumMet 
                      ? 'bg-[#FFDE59] hover:bg-yellow-400 text-[#0A0F1D] cursor-pointer shadow-yellow-500/20' 
                      : isDark ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Continuar para Entrega <ArrowRight size={18} />
                </button>
              </div>
            )}
          </>
        ) : (
          /* MODO FORMULÁRIO DE CHECKOUT */
          <form onSubmit={sendOrderToWhatsApp} className="flex-1 flex flex-col justify-between overflow-y-auto custom-scrollbar">
            <div className="p-5 space-y-5">
              
              {/* Dados do Cliente */}
              <div className="space-y-3">
                <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isDark ? 'text-gray-400' : 'text-slate-600'
                }`}>
                  <User size={14} className={isDark ? "text-[#00E5FF]" : "text-[#0284C7]"} /> Seus Dados
                </label>
                <input 
                  type="text" 
                  name="nome"
                  required
                  placeholder="Seu Nome Completo"
                  value={formData.nome}
                  onChange={handleInputChange}
                  className={`w-full border rounded-xl px-4 py-3 text-[16px] focus:outline-none transition-colors ${
                    isDark 
                      ? 'bg-[#101935] border-white/10 text-white placeholder-gray-500 focus:border-[#00E5FF]' 
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#0284C7] shadow-sm'
                  }`}
                />
                <input 
                  type="tel" 
                  name="telefone"
                  required
                  placeholder="WhatsApp / Telefone (ex: 21 99999-9999)"
                  value={formData.telefone}
                  onChange={handleInputChange}
                  className={`w-full border rounded-xl px-4 py-3 text-[16px] focus:outline-none transition-colors ${
                    isDark 
                      ? 'bg-[#101935] border-white/10 text-white placeholder-gray-500 focus:border-[#00E5FF]' 
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#0284C7] shadow-sm'
                  }`}
                />
              </div>

              {/* Endereço & Frete */}
              <div className="space-y-3">
                <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isDark ? 'text-gray-400' : 'text-slate-600'
                }`}>
                  <MapPin size={14} className={isDark ? "text-[#00E5FF]" : "text-[#0284C7]"} /> Endereço de Entrega
                </label>
                
                <div className="relative">
                  <input 
                    type="text" 
                    name="cep"
                    maxLength={9}
                    placeholder="CEP (opcional - busca automática)"
                    value={formData.cep}
                    onChange={handleCepChange}
                    className={`w-full border rounded-xl px-4 py-3 text-[16px] focus:outline-none transition-colors ${
                      isDark 
                        ? 'bg-[#101935] border-white/10 text-white placeholder-gray-500 focus:border-[#00E5FF]' 
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#0284C7] shadow-sm'
                    }`}
                  />
                  {cepLoading && (
                    <span className={`absolute right-3 top-3.5 text-xs animate-pulse ${isDark ? 'text-[#00E5FF]' : 'text-[#0284C7]'}`}>Buscando...</span>
                  )}
                </div>

                <select 
                  name="bairro"
                  required
                  value={formData.bairro}
                  onChange={handleInputChange}
                  className={`w-full border rounded-xl px-4 py-3 text-[16px] focus:outline-none transition-colors ${
                    isDark 
                      ? 'bg-[#101935] border-white/10 text-white focus:border-[#00E5FF]' 
                      : 'bg-white border-slate-200 text-slate-900 focus:border-[#0284C7] shadow-sm'
                  }`}
                >
                  <option value="">Selecione seu Bairro...</option>
                  {bairrosOrdenados.map((b) => (
                    <option key={b.id || b.bairro} value={b.bairro}>
                      {b.bairro} (+ R$ {Number(b.valor).toFixed(2).replace('.', ',')})
                    </option>
                  ))}
                </select>

                <input 
                  type="text" 
                  name="endereco"
                  required
                  placeholder="Rua / Avenida e Número"
                  value={formData.endereco}
                  onChange={handleInputChange}
                  className={`w-full border rounded-xl px-4 py-3 text-[16px] focus:outline-none transition-colors ${
                    isDark 
                      ? 'bg-[#101935] border-white/10 text-white placeholder-gray-500 focus:border-[#00E5FF]' 
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#0284C7] shadow-sm'
                  }`}
                />

                <input 
                  type="text" 
                  name="complemento"
                  placeholder="Complemento / Bloco / Apto (opcional)"
                  value={formData.complemento}
                  onChange={handleInputChange}
                  className={`w-full border rounded-xl px-4 py-3 text-[16px] focus:outline-none transition-colors ${
                    isDark 
                      ? 'bg-[#101935] border-white/10 text-white placeholder-gray-500 focus:border-[#00E5FF]' 
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#0284C7] shadow-sm'
                  }`}
                />
              </div>

              {/* Cupom de Desconto */}
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                  Cupom de Desconto
                </label>
                {cupomAtivo ? (
                  <div className={`flex items-center justify-between border rounded-xl p-3 ${
                    isDark ? 'bg-[#00E5FF]/10 border-[#00E5FF]/40 text-[#00E5FF]' : 'bg-sky-50 border-sky-300 text-sky-800'
                  }`}>
                    <span className="text-xs font-bold">
                      Cupom <strong>{cupomAtivo.codigo}</strong> ({cupomAtivo.porcentagem_desconto}% OFF)
                    </span>
                    <button 
                      type="button" 
                      onClick={removeCoupon} 
                      className="text-xs text-red-500 hover:text-red-700 font-bold"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Código do Cupom"
                      value={cupomInput}
                      onChange={(e) => setCupomInput(e.target.value.toUpperCase())}
                      className={`flex-1 border rounded-xl px-4 py-2 text-[16px] focus:outline-none transition-colors ${
                        isDark 
                          ? 'bg-[#101935] border-white/10 text-white focus:border-[#00E5FF]' 
                          : 'bg-white border-slate-200 text-slate-900 focus:border-[#0284C7] shadow-sm'
                      }`}
                    />
                    <button
                      type="button"
                      disabled={cupomLoading || !cupomInput.trim()}
                      onClick={validateCoupon}
                      className={`border font-bold px-4 py-2 rounded-xl text-xs uppercase transition-colors disabled:opacity-50 ${
                        isDark 
                          ? 'bg-[#101935] border-[#00E5FF]/40 text-[#00E5FF] hover:bg-[#00E5FF]/10' 
                          : 'bg-sky-50 border-sky-300 text-sky-700 hover:bg-sky-100'
                      }`}
                    >
                      {cupomLoading ? '...' : 'Aplicar'}
                    </button>
                  </div>
                )}
              </div>

              {/* Forma de Pagamento */}
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isDark ? 'text-gray-400' : 'text-slate-600'
                }`}>
                  <CreditCard size={14} className={isDark ? "text-[#00E5FF]" : "text-[#0284C7]"} /> Forma de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'PIX', label: 'PIX' },
                    { id: 'CREDITO', label: 'CRÉDITO (MÁQUINA)' },
                    { id: 'DEBITO', label: 'DÉBITO (MÁQUINA)' },
                    { id: 'DINHEIRO', label: 'DINHEIRO' }
                  ].map((metodo) => (
                    <button
                      key={metodo.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, pagamento: metodo.id }))}
                      className={`p-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all text-center flex items-center justify-center min-h-[46px] ${
                        formData.pagamento === metodo.id 
                          ? isDark 
                            ? 'border-[#00E5FF] bg-[#00E5FF]/15 text-[#00E5FF]' 
                            : 'border-[#0284C7] bg-sky-50 text-[#0284C7]'
                          : isDark 
                            ? 'border-white/10 bg-[#101935] text-gray-400 hover:border-white/20' 
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {metodo.label}
                    </button>
                  ))}
                </div>

                {formData.pagamento === 'DINHEIRO' && (
                  <input 
                    type="text" 
                    name="troco"
                    placeholder="Precisa de troco para quanto? (ex: R$ 100)"
                    value={formData.troco}
                    onChange={handleInputChange}
                    className={`w-full mt-2 border rounded-xl px-4 py-3 text-[16px] focus:outline-none transition-colors ${
                      isDark 
                        ? 'bg-[#101935] border-white/10 text-white placeholder-gray-500 focus:border-[#00E5FF]' 
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#0284C7] shadow-sm'
                    }`}
                  />
                )}
              </div>

            </div>

            {/* Resumo Final & Disparo WhatsApp */}
            <div className={`p-5 border-t space-y-3 ${
              isDark ? 'bg-[#101935] border-white/10' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`space-y-1 text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                {valorDesconto > 0 && (
                  <div className={`flex justify-between ${isDark ? 'text-[#00E5FF]' : 'text-emerald-600 font-bold'}`}>
                    <span>Desconto ({cupomAtivo.codigo}):</span>
                    <span>-R$ {valorDesconto.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Taxa de Entrega:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {frete > 0 ? `R$ ${frete.toFixed(2).replace('.', ',')}` : 'Selecione o bairro'}
                  </span>
                </div>
                <div className={`flex justify-between text-base font-bold pt-2 border-t ${
                  isDark ? 'border-white/10 text-white' : 'border-slate-200 text-slate-900'
                }`}>
                  <span>Total:</span>
                  <span className={`font-display font-black text-xl ${
                    isDark ? 'text-[#00E5FF]' : 'text-[#0284C7]'
                  }`}>
                    R$ {totalGeral.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !formData.bairro}
                className="w-full bg-[#25D366] hover:bg-emerald-500 text-black py-4 rounded-xl font-display font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Processando...</span>
                ) : (
                  <>
                    <Send size={18} /> Concluir e Enviar no WhatsApp
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default Cart;
