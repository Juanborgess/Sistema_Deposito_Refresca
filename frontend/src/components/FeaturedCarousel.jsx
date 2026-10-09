import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Zap, Sparkles, Flame } from 'lucide-react';
import ProductCard from './ProductCard';
import api from '../services/api';

const FeaturedCarousel = () => {
  const [timeLeft, setTimeLeft] = useState(6 * 3600 + 45 * 60);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await api.get('/products');
        const destaques = (response.data || [])
          .filter(p => p.badge || p.valor_promocional);
        
        setFeaturedProducts(destaques.slice(0, 4));
      } catch (error) {
        console.error("Erro ao buscar produtos em destaque:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading || featuredProducts.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-gradient-to-r from-[#101935] via-[#152244] to-[#101935] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow de Fundo */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#FFDE59]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-white/10 pb-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#FFDE59] mb-1">
              <Flame size={16} className="text-[#FFDE59] animate-bounce" /> Ofertas Relâmpago
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-black uppercase text-white tracking-wider">
              Bebidas em <span className="text-[#00E5FF]">Super Promoção</span>
            </h2>
          </div>

          <div className="flex items-center gap-3 bg-[#0A0F1D] border border-white/10 px-4 py-2.5 rounded-2xl w-fit">
            <span className="text-xs text-gray-400 font-bold uppercase">Termina em:</span>
            <span className="font-display font-black text-sm text-[#FFDE59] tracking-widest">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Grid de Destaques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
          {featuredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

      </div>
    </section>
  );
};

export default FeaturedCarousel;
