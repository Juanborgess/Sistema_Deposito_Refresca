import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Zap, Sparkles, Flame } from 'lucide-react';
import ProductCard from './ProductCard';
import api from '../services/api';
import { useThemeStore } from '../store/useThemeStore';

const FeaturedCarousel = () => {
  const [timeLeft, setTimeLeft] = useState(6 * 3600 + 45 * 60);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

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
      <div className={`rounded-3xl p-6 md:p-8 relative overflow-hidden transition-all ${
        isDark 
          ? 'bg-gradient-to-r from-[#101935] via-[#152244] to-[#101935] border border-white/10 shadow-2xl' 
          : 'bg-gradient-to-r from-amber-50/80 via-sky-50/60 to-amber-50/80 border border-amber-200/80 shadow-lg'
      }`}>
        
        {/* Glow de Fundo */}
        <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none ${
          isDark ? 'bg-[#FFDE59]/10' : 'bg-amber-300/20'
        }`} />

        <div className={`flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b pb-6 relative z-10 ${
          isDark ? 'border-white/10' : 'border-amber-200/60'
        }`}>
          <div>
            <div className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider mb-1 ${
              isDark ? 'text-[#FFDE59]' : 'text-amber-700'
            }`}>
              <Flame size={16} className={`animate-bounce ${isDark ? 'text-[#FFDE59]' : 'text-amber-600'}`} /> Ofertas Relâmpago
            </div>
            <h2 className={`text-2xl md:text-3xl font-display font-black uppercase tracking-wider ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Bebidas em <span className={isDark ? "text-[#00E5FF]" : "text-[#0284C7]"}>Super Promoção</span>
            </h2>
          </div>

          <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl w-fit border ${
            isDark 
              ? 'bg-[#0A0F1D] border-white/10' 
              : 'bg-white border-amber-200 shadow-sm'
          }`}>
            <span className={`text-xs font-bold uppercase ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Termina em:</span>
            <span className={`font-display font-black text-sm tracking-widest ${
              isDark ? 'text-[#FFDE59]' : 'text-amber-600'
            }`}>
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
