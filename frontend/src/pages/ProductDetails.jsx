import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, MessageCircle, ShoppingBag, ShieldCheck, Zap, Snowflake } from 'lucide-react';
import api from '../services/api';
import useCartStore from '../store/cartStore';
import toast from 'react-hot-toast';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  
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
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#0A0F1D]">
        <div className="w-16 h-16 border-4 border-[#00E5FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#0A0F1D]">
        <h2 className="text-2xl font-display font-bold text-white mb-4">Produto não encontrado</h2>
        <button onClick={() => navigate('/')} className="text-[#00E5FF] hover:underline font-bold uppercase tracking-wider text-sm">Voltar para a loja</button>
      </div>
    );
  }

  const validationMsg = getValidationMessage();
  const unitTotal = product.valor + priceAddons;
  const totalPrice = unitTotal * quantity;

  return (
    <div className="w-full bg-[#0A0F1D] min-h-screen pt-24 pb-20 relative z-10">
      <Helmet>
        <title>{product.nome} | Refresca Bebidas</title>
        <meta name="description" content={`Compre ${product.nome} gelada com entrega expressa no Rio de Janeiro. Barra da Tijuca e região.`} />
      </Helmet>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb & Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 hover:text-[#00E5FF] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="text-sm font-medium text-gray-500 flex gap-2">
            <Link to="/" className="hover:text-white transition-colors">Início</Link>
            <span>/</span>
            <span className="text-gray-300">{product.categoria}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          
          {/* Coluna Esquerda: Imagem */}
          <div className="w-full relative">
            <div className="aspect-[4/5] lg:aspect-square w-full bg-[#070B16] rounded-3xl border border-white/5 p-8 flex items-center justify-center relative overflow-hidden group shadow-2xl">
              <div className="absolute inset-0 bg-radial from-[#00E5FF]/10 via-transparent to-transparent opacity-50"></div>
              
              {product.badge && (
                <div className="absolute top-6 left-6 z-20 bg-[#FFDE59] text-[#0A0F1D] text-xs md:text-sm font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(255,222,89,0.3)]">
                  {product.badge}
                </div>
              )}
              
              <img 
                src={product.imagem} 
                alt={product.nome}
                className="w-full h-full object-contain relative z-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>

          {/* Coluna Direita: Detalhes e Compra */}
          <div className="flex flex-col">
            <div className="mb-2">
              <span className="text-xs md:text-sm font-display font-bold text-[#00E5FF] uppercase tracking-widest">
                {product.categoria}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black font-display text-white leading-tight tracking-tighter mb-6">
              {product.nome}
            </h1>
            
            <div className="flex flex-col gap-1 mb-8 pb-8 border-b border-white/10">
              {priceAddons > 0 && (
                <span className="text-gray-400 text-sm line-through">
                  Base: R$ {product.valor.toFixed(2).replace('.', ',')}
                </span>
              )}
              <div className="flex items-baseline gap-4">
                <span className="text-4xl md:text-5xl font-black font-display text-[#FFDE59] drop-shadow-[0_0_15px_rgba(255,222,89,0.2)]">
                  R$ {totalPrice.toFixed(2).replace('.', ',')}
                </span>
                {product.valorOriginal && product.valorOriginal > product.valor && (
                  <span className="text-lg text-gray-500 line-through">
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
                    <div key={group.id} className="bg-[#101935] border border-white/5 rounded-2xl p-5">
                      <div className="flex justify-between items-end mb-4">
                        <div>
                          <h3 className="text-white font-bold text-lg mb-1">{group.titulo}</h3>
                          <span className="text-gray-400 text-xs uppercase tracking-wider">
                            {group.min > 0 ? `Obrigatório (Escolha ${group.min === group.max ? group.min : `de ${group.min} até ${group.max}`})` : `Opcional (Até ${group.max})`}
                          </span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${isSatisfied ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
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
                                  ? 'bg-[#00E5FF]/10 border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.2)]' 
                                  : isDisabled 
                                    ? 'bg-white/5 border-transparent text-gray-600 opacity-50 cursor-not-allowed'
                                    : 'bg-[#0A0F1D] border-white/10 text-gray-300 hover:border-white/30 hover:bg-white/5'
                                }`}
                            >
                              <span className={isSelected ? 'text-[#00E5FF] font-bold' : 'text-white'}>{option.nome}</span>
                              {option.adicional > 0 && (
                                <span className={`text-xs mt-1 ${isSelected ? 'text-[#00E5FF]/80' : 'text-gray-500'}`}>
                                  + R$ {Number(option.adicional).toFixed(2).replace('.', ',')}
                                </span>
                              )}
                              
                              {/* Selection Indicator */}
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse"></div>
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
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Observações (Opcional)</h3>
              <textarea
                value={observation}
                onChange={e => setObservation(e.target.value)}
                placeholder="Ex: Mandar copos descartáveis, gelo extra, troco para 50..."
                className="w-full bg-[#101935] border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] resize-none h-24"
              ></textarea>
            </div>

            {/* Controles de Quantidade e CTA */}
            <div className="flex flex-col gap-4 mb-10">
              
              {validationMsg && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm px-4 py-3 rounded-lg flex items-center gap-2 font-bold uppercase tracking-wider text-xs">
                  <span className="animate-pulse">⚠️</span> {validationMsg}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center justify-between bg-[#101935] rounded-full px-4 h-14 border border-white/5 w-full sm:w-36 shrink-0">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white text-xl font-medium transition-colors">-</button>
                  <span className="text-white font-bold font-display text-lg">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white text-xl font-medium transition-colors">+</button>
                </div>
                
                <button 
                  onClick={handleAddToCart}
                  disabled={!isFormValid()}
                  className={`group relative overflow-hidden flex justify-center items-center py-4 min-h-[56px] flex-1 rounded-full transition-all w-full
                    ${isFormValid() 
                      ? 'bg-[#FFDE59] text-[#0A0F1D] shadow-[0_0_20px_rgba(255,222,89,0.2)] hover:shadow-[0_0_30px_rgba(255,222,89,0.4)] active:scale-95' 
                      : 'bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed'}`}
                >
                  {isFormValid() && (
                    <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  )}
                  <span className="flex items-center justify-center font-black font-display text-[10px] sm:text-xs md:text-sm uppercase tracking-widest relative z-10 gap-2 md:gap-3">
                    <ShoppingBag size={20} className={isFormValid() ? 'text-[#0A0F1D]' : 'text-gray-500'} />
                    {isFormValid() ? 'Adicionar ao Carrinho' : 'Selecione as Opções'}
                  </span>
                </button>
              </div>
            </div>

            {/* Atalho WhatsApp */}
            <a href="https://wa.me/5521983785928?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20Refresca%20e%20gostaria%20de%20fazer%20um%20pedido%20para%20entrega." target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full min-h-[56px] h-auto py-3 px-4 rounded-full bg-[#101935] border border-white/5 hover:border-[#00E5FF]/50 hover:bg-[#00E5FF]/10 text-gray-300 hover:text-white font-medium transition-all duration-300 mb-10 text-center text-sm md:text-base">
              <MessageCircle size={22} className="text-[#00E5FF] shrink-0" />
              <span>Dúvidas? Compre direto pelo WhatsApp</span>
            </a>

            {/* Badges de Confiança */}
            <div className="grid grid-cols-2 gap-4 pt-8 border-t border-white/10 text-xs md:text-sm text-gray-400 font-medium">
              <div className="flex items-center gap-2">
                <Snowflake size={20} className="text-[#00E5FF]" />
                <span>Bebida sempre gelada</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={20} className="text-[#FFDE59]" />
                <span>Entrega Expressa RJ</span>
              </div>
            </div>

          </div>
        </div>
        
        {/* Abas Inferiores (Tabs) */}
        <div className="mt-20 border-t border-white/10 pt-10">
          <div className="flex gap-8 border-b border-white/10 mb-8">
            <button 
              onClick={() => setActiveTab('descricao')}
              className={`pb-4 text-sm md:text-base font-bold font-display uppercase tracking-wider transition-all duration-300 border-b-2 ${
                activeTab === 'descricao' 
                  ? 'border-[#00E5FF] text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]' 
                  : 'border-transparent text-gray-500 hover:text-white'
              }`}
            >
              Descrição Completa
            </button>
          </div>

          <div className="text-gray-300 leading-relaxed font-medium max-w-4xl">
            {activeTab === 'descricao' && (
              <div className="space-y-4">
                {product.descricao ? (
                  <p className="whitespace-pre-wrap">{product.descricao}</p>
                ) : (
                  <p>A bebida ideal para o seu momento. Compre com a Refresca e garanta entrega rápida e temperatura perfeita para o seu evento ou churrasco.</p>
                )}
                <p className="text-[#FFDE59] font-bold mt-6">⚠️ Produto original garantido. Venda de bebidas alcoólicas proibida para menores de 18 anos.</p>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ProductDetails;
