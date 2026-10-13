import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, MessageCircle, ShoppingBag, ShieldCheck, Zap, Snowflake } from 'lucide-react';
import api from '../services/api';
import useCartStore from '../store/cartStore';
import { useThemeStore } from '../store/useThemeStore';
import toast from 'react-hot-toast';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('descricao');
  
  // Variações e adicionais
  const [selectedVariations, setSelectedVariations] = useState({});
  const [priceAddons, setPriceAddons] = useState(0);
  const [observation, setObservation] = useState('');
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await api.get('/products');
        const found = (response.data || []).find((p) => p.id === id);
        
        if (found) {
          const mapped = {
            ...found,
            valor: found.valor_promocional ? Number(found.valor_promocional) : Number(found.valor),
            valorOriginal: Number(found.valor),
            imagem: found.imagem_url || '/logo_refresca.png',
            variacoes: Array.isArray(found.variacoes) ? found.variacoes : []
          };
          setProduct(mapped);
          
          // Pré-seleciona grupos que são obrigatórios e possuem apenas 1 opção
          const initialSelections = {};
          mapped.variacoes.forEach((group) => {
            if (group.min === 1 && group.max === 1 && group.opcoes && group.opcoes.length === 1 && group.opcoes[0].ativo) {
              initialSelections[group.id] = [group.opcoes[0].id];
            }
          });
          setSelectedVariations(initialSelections);
        }
      } catch (error) {
        console.error("Erro ao buscar detalhes do produto:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);

  // Atualiza preço adicional quando opções são selecionadas
  useEffect(() => {
    if (!product || !product.variacoes) return;
    let addons = 0;
    product.variacoes.forEach((group) => {
      const selectedIds = selectedVariations[group.id] || [];
      selectedIds.forEach((sId) => {
        const opt = group.opcoes.find((o) => o.id === sId);
        if (opt) addons += Number(opt.adicional || 0);
      });
    });
    setPriceAddons(addons);
  }, [selectedVariations, product]);

  const handleSelectOption = (group, option) => {
    if (!option.ativo) return;

    setSelectedVariations((prev) => {
      const current = prev[group.id] || [];
      const isSelected = current.includes(option.id);
      
      let nextSelected;
      if (isSelected) {
        nextSelected = current.filter((id) => id !== option.id);
      } else {
        if (current.length < group.max) {
          nextSelected = [...current, option.id];
        } else if (group.max === 1) {
          nextSelected = [option.id];
        } else {
          nextSelected = current;
        }
      }
      return { ...prev, [group.id]: nextSelected };
    });
  };

  const isFormValid = () => {
    if (!product || !product.variacoes) return true;
    for (const group of product.variacoes) {
      const selectedIds = selectedVariations[group.id] || [];
      if (selectedIds.length < group.min) return false;
    }
    return true;
  };

  const getValidationMessage = () => {
    if (!product || !product.variacoes) return null;
    for (const group of product.variacoes) {
      const selectedIds = selectedVariations[group.id] || [];
      if (selectedIds.length < group.min) {
        if (group.min === 1 && group.max === 1) {
          return `Selecione 1 opção em "${group.titulo}"`;
        }
        return `Faltam ${group.min - selectedIds.length} opções em "${group.titulo}"`;
      }
    }
    return null;
  };

  const handleAddToCart = () => {
    if (!isFormValid()) return;
    
    const finalProduct = {
      ...product,
      valor_final: product.valor + priceAddons
    };
    
    const cartVariations = [];
    if (product.variacoes) {
      product.variacoes.forEach((group) => {
        const selectedIds = selectedVariations[group.id] || [];
        if (selectedIds.length > 0) {
          const selectedOpts = selectedIds.map((sId) => group.opcoes.find((o) => o.id === sId)).filter(Boolean);
          cartVariations.push({
            grupo_nome: group.titulo,
            opcoes: selectedOpts
          });
        }
      });
    }

    addItem(finalProduct, cartVariations, quantity, observation);
    toast.success(`${product.nome} adicionado ao carrinho!`, { icon: '🍺' });
  };

  if (loading) {
    return (
      <div className={`min-h-[80vh] flex flex-col items-center justify-center transition-colors ${
        isDark ? 'bg-[#0A0F1D]' : 'bg-[#F8FAFC]'
      }`}>
        <div className={`w-16 h-16 border-4 border-t-transparent rounded-full animate-spin ${
          isDark ? 'border-[#00E5FF]' : 'border-[#0284C7]'
        }`}></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={`min-h-[80vh] flex flex-col items-center justify-center transition-colors ${
        isDark ? 'bg-[#0A0F1D]' : 'bg-[#F8FAFC]'
      }`}>
        <h2 className={`text-2xl font-display font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Produto não encontrado</h2>
        <button onClick={() => navigate('/')} className={`hover:underline font-bold uppercase tracking-wider text-sm ${
          isDark ? 'text-[#00E5FF]' : 'text-[#0284C7]'
        }`}>Voltar para a loja</button>
      </div>
    );
  }

  const validationMsg = getValidationMessage();
  const unitTotal = product.valor + priceAddons;
  const totalPrice = unitTotal * quantity;

  return (
    <div className={`w-full min-h-screen pt-24 pb-20 relative z-10 transition-colors ${
      isDark ? 'bg-[#0A0F1D]' : 'bg-[#F8FAFC]'
    }`}>
      <Helmet>
        <title>{product.nome} | Refresca Bebidas</title>
        <meta name="description" content={`Compre ${product.nome} gelada com entrega expressa no Rio de Janeiro. Barra da Tijuca e região.`} />
      </Helmet>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb & Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
            isDark 
              ? 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-[#00E5FF]' 
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#0284C7] shadow-sm'
          }`}>
            <ArrowLeft size={20} />
          </Link>
          <div className="text-sm font-medium flex gap-2">
            <Link to="/" className={`transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>Início</Link>
            <span className={isDark ? 'text-gray-600' : 'text-slate-400'}>/</span>
            <span className={isDark ? 'text-gray-300' : 'text-slate-700 font-semibold'}>{product.categoria}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          
          {/* Coluna Esquerda: Imagem */}
          <div className="w-full relative">
            <div className={`aspect-[4/5] lg:aspect-square w-full rounded-3xl border p-8 flex items-center justify-center relative overflow-hidden group shadow-xl ${
              isDark ? 'bg-[#070B16] border-white/5' : 'bg-white border-slate-200'
            }`}>
              <div className={`absolute inset-0 bg-radial via-transparent to-transparent opacity-50 ${
                isDark ? 'from-[#00E5FF]/10' : 'from-sky-100/60'
              }`}></div>
              
              {product.badge && (
                <div className="absolute top-6 left-6 z-20 bg-[#FFDE59] text-[#0A0F1D] text-xs md:text-sm font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg">
                  {product.badge}
                </div>
              )}
              
              <img 
                src={product.imagem} 
                alt={product.nome}
                className="w-full h-full object-contain relative z-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>

          {/* Coluna Direita: Detalhes e Compra */}
          <div className="flex flex-col">
            <div className="mb-2">
              <span className={`text-xs md:text-sm font-display font-bold uppercase tracking-widest ${
                isDark ? 'text-[#00E5FF]' : 'text-[#0284C7]'
              }`}>
                {product.categoria}
              </span>
            </div>
            
            <h1 className={`text-3xl md:text-4xl lg:text-5xl font-black font-display leading-tight tracking-tight mb-6 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {product.nome}
            </h1>
            
            <div className={`flex flex-col gap-1 mb-8 pb-8 border-b ${
              isDark ? 'border-white/10' : 'border-slate-200'
            }`}>
              {priceAddons > 0 && (
                <span className={`text-sm line-through ${isDark ? 'text-gray-400' : 'text-slate-400'}`}>
                  Base: R$ {product.valor.toFixed(2).replace('.', ',')}
                </span>
              )}
              <div className="flex items-baseline gap-4">
                <span className={`text-4xl md:text-5xl font-black font-display ${
                  isDark ? 'text-[#FFDE59]' : 'text-amber-600'
                }`}>
                  R$ {totalPrice.toFixed(2).replace('.', ',')}
                </span>
                {product.valorOriginal && product.valorOriginal > product.valor && (
                  <span className={`text-lg line-through ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                    R$ {product.valorOriginal.toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>
            </div>

            {/* Variações */}
            {product.variacoes && product.variacoes.length > 0 && (
              <div className="mb-8 space-y-6">
                {product.variacoes.map(group => {
                  const selectedIds = selectedVariations[group.id] || [];
                  const isSatisfied = selectedIds.length >= group.min;

                  return (
                    <div key={group.id} className={`border rounded-2xl p-5 ${
                      isDark ? 'bg-[#101935] border-white/5' : 'bg-white border-slate-200 shadow-sm'
                    }`}>
                      <div className="flex justify-between items-end mb-4">
                        <div>
                          <h3 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{group.titulo}</h3>
                          <span className={`text-xs uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                            {group.min > 0 ? `Obrigatório (Escolha ${group.min === group.max ? group.min : `de ${group.min} até ${group.max}`})` : `Opcional (Até ${group.max})`}
                          </span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${isSatisfied ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-600'}`}>
                          {selectedIds.length} / {group.max}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        {group.opcoes.filter(opt => opt.ativo).map(option => {
                          const isSelected = selectedIds.includes(option.id);
                          const isDisabled = !isSelected && selectedIds.length >= group.max;

                          return (
                            <button
                              key={option.id}
                              disabled={isDisabled}
                              onClick={() => handleSelectOption(group, option)}
                              className={`relative px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 border text-left flex flex-col min-w-[140px]
                                ${isSelected 
                                  ? isDark 
                                    ? 'bg-[#00E5FF]/10 border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.2)]' 
                                    : 'bg-sky-50 border-[#0284C7] shadow-sm'
                                  : isDisabled 
                                    ? isDark 
                                      ? 'bg-white/5 border-transparent text-gray-600 opacity-50 cursor-not-allowed'
                                      : 'bg-slate-100 border-transparent text-slate-400 opacity-50 cursor-not-allowed'
                                    : isDark 
                                      ? 'bg-[#0A0F1D] border-white/10 text-gray-300 hover:border-white/30 hover:bg-white/5'
                                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                                }`}
                            >
                              <span className={isSelected ? (isDark ? 'text-[#00E5FF] font-bold' : 'text-[#0284C7] font-bold') : (isDark ? 'text-white' : 'text-slate-900')}>{option.nome}</span>
                              {option.adicional > 0 && (
                                <span className={`text-xs mt-1 ${isSelected ? (isDark ? 'text-[#00E5FF]/80' : 'text-[#0284C7]') : (isDark ? 'text-gray-500' : 'text-slate-500')}`}>
                                  + R$ {Number(option.adicional).toFixed(2).replace('.', ',')}
                                </span>
                              )}
                              
                              {/* Selection Indicator */}
                              {isSelected && (
                                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse ${
                                  isDark ? 'bg-[#00E5FF]' : 'bg-[#0284C7]'
                                }`}></div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Campo de Observação */}
            <div className="mb-8">
              <h3 className={`text-sm font-medium uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Observações (Opcional)</h3>
              <textarea
                value={observation}
                onChange={e => setObservation(e.target.value)}
                placeholder="Ex: Mandar copos descartáveis, gelo extra, troco para 50..."
                className={`w-full rounded-xl p-4 resize-none h-24 border focus:outline-none transition-colors ${
                  isDark 
                    ? 'bg-[#101935] border-white/10 text-white placeholder:text-gray-600 focus:border-[#00E5FF]' 
                    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#0284C7] shadow-sm'
                }`}
              ></textarea>
            </div>

            {/* Controles de Quantidade e CTA */}
            <div className="flex flex-col gap-4 mb-10">
              
              {validationMsg && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 text-sm px-4 py-3 rounded-lg flex items-center gap-2 font-bold uppercase tracking-wider text-xs">
                  <span className="animate-pulse">⚠️</span> {validationMsg}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <div className={`flex items-center justify-between rounded-full px-4 h-14 border w-full sm:w-36 shrink-0 ${
                  isDark ? 'bg-[#101935] border-white/5' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className={`w-8 h-8 flex items-center justify-center text-xl font-medium transition-colors ${
                    isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}>-</button>
                  <span className={`font-bold font-display text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className={`w-8 h-8 flex items-center justify-center text-xl font-medium transition-colors ${
                    isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}>+</button>
                </div>
                
                <button 
                  onClick={handleAddToCart}
                  disabled={!isFormValid()}
                  className={`group relative overflow-hidden flex justify-center items-center py-4 min-h-[56px] flex-1 rounded-full transition-all w-full
                    ${isFormValid() 
                      ? 'bg-[#FFDE59] text-[#0A0F1D] shadow-lg shadow-yellow-500/20 hover:bg-yellow-400 active:scale-95' 
                      : isDark ? 'bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                  <span className="flex items-center justify-center font-black font-display text-[10px] sm:text-xs md:text-sm uppercase tracking-widest relative z-10 gap-2 md:gap-3">
                    <ShoppingBag size={20} className={isFormValid() ? 'text-[#0A0F1D]' : isDark ? 'text-gray-500' : 'text-slate-400'} />
                    {isFormValid() ? 'Adicionar ao Carrinho' : 'Selecione as Opções'}
                  </span>
                </button>
              </div>
            </div>

            {/* Atalho WhatsApp */}
            <a 
              href="https://wa.me/5521983785928?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20Refresca%20e%20gostaria%20de%20fazer%20um%20pedido%20para%20entrega." 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`flex items-center justify-center gap-3 w-full min-h-[56px] h-auto py-3 px-4 rounded-full border font-medium transition-all duration-300 mb-10 text-center text-sm md:text-base ${
                isDark 
                  ? 'bg-[#101935] border-white/5 hover:border-[#00E5FF]/50 hover:bg-[#00E5FF]/10 text-gray-300 hover:text-white' 
                  : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-sm'
              }`}
            >
              <MessageCircle size={22} className={isDark ? "text-[#00E5FF] shrink-0" : "text-[#0284C7] shrink-0"} />
              <span>Dúvidas? Compre direto pelo WhatsApp</span>
            </a>

            {/* Badges de Confiança */}
            <div className={`grid grid-cols-2 gap-4 pt-8 border-t text-xs md:text-sm font-medium ${
              isDark ? 'border-white/10 text-gray-400' : 'border-slate-200 text-slate-600'
            }`}>
              <div className="flex items-center gap-2">
                <Snowflake size={20} className={isDark ? "text-[#00E5FF]" : "text-[#0284C7]"} />
                <span>Bebida sempre gelada</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={20} className={isDark ? "text-[#FFDE59]" : "text-amber-500"} />
                <span>Entrega Expressa RJ</span>
              </div>
            </div>

          </div>
        </div>
        
        {/* Abas Inferiores (Tabs) */}
        <div className={`mt-20 border-t pt-10 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          <div className={`flex gap-8 border-b mb-8 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            <button 
              onClick={() => setActiveTab('descricao')}
              className={`pb-4 text-sm md:text-base font-bold font-display uppercase tracking-wider transition-all duration-300 border-b-2 ${
                activeTab === 'descricao' 
                  ? isDark 
                    ? 'border-[#00E5FF] text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]' 
                    : 'border-[#0284C7] text-[#0284C7]'
                  : isDark 
                    ? 'border-transparent text-gray-500 hover:text-white' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Descrição Completa
            </button>
          </div>

          <div className={`leading-relaxed font-medium max-w-4xl ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
            {activeTab === 'descricao' && (
              <div className="space-y-4">
                {product.descricao ? (
                  <p className="whitespace-pre-wrap">{product.descricao}</p>
                ) : (
                  <p>A bebida ideal para o seu momento. Compre com a Refresca e garanta entrega rápida e temperatura perfeita para o seu evento ou churrasco.</p>
                )}
                <p className={`font-bold mt-6 ${isDark ? 'text-[#FFDE59]' : 'text-amber-600'}`}>⚠️ Produto original garantido. Venda de bebidas alcoólicas proibida para menores de 18 anos.</p>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ProductDetails;
