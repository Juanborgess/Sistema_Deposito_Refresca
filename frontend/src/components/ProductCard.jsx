import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';

const ProductCard = ({ product }) => {
  const cardRef = useRef(null);
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  // Efeito Lanterna (Flashlight) no hover
  const handleMouseMove = (e) => {
    if (!cardRef.current || window.matchMedia('(hover: none)').matches) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleCardClick = () => {
    navigate(`/produto/${product.id}`);
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`group relative flex flex-col rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-2 h-full border ${
        isDark 
          ? 'bg-[#101935] border-white/5 shadow-xl hover:border-[#00E5FF]/40' 
          : 'bg-white border-slate-200 shadow-md hover:shadow-xl hover:border-sky-400'
      }`}
    >
      {/* Flashlight Overlay */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" 
        style={{ 
          background: isDark 
            ? 'radial-gradient(500px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(0, 229, 255, 0.1), transparent 45%)'
            : 'radial-gradient(500px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(2, 132, 199, 0.08), transparent 45%)'
        }}
      />

      {/* Área da Imagem da Bebida */}
      <Link 
        to={`/produto/${product.id}`} 
        className={`relative w-full aspect-square overflow-hidden p-6 flex items-center justify-center block transition-colors ${
          isDark ? 'bg-[#070B16]' : 'bg-slate-50/80 border-b border-slate-100'
        }`}
      >
        {/* Badge Promocional */}
        {product.badge && (
          <div className="absolute top-3 left-3 z-20 bg-[#FFDE59] text-[#0A0F1D] text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
            {product.badge}
          </div>
        )}
        
        <img 
          src={product.imagem_url || '/logo_refresca.png'} 
          alt={product.nome}
          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 relative z-10 drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]"
          loading="lazy"
        />
        
        {/* Glow sutil atrás da imagem */}
        <div className={`absolute inset-0 bg-gradient-to-t via-transparent to-transparent z-10 ${
          isDark ? 'from-[#101935]' : 'from-white/60'
        }`} />
      </Link>

      {/* Informações da Bebida */}
      <div className="p-5 flex flex-col flex-1 relative z-20">
        <span className={`text-[11px] font-display font-bold uppercase tracking-widest mb-1 ${
          isDark ? 'text-[#00E5FF]' : 'text-[#0284C7]'
        }`}>
          {product.categoria}
        </span>
        
        <Link to={`/produto/${product.id}`} className="transition-colors">
          <h3 className={`font-display text-sm md:text-base font-bold leading-tight mb-3 line-clamp-2 ${
            isDark ? 'text-white hover:text-[#00E5FF]' : 'text-slate-900 hover:text-[#0284C7]'
          }`}>
            {product.nome}
          </h3>
        </Link>
        
        <div className="mt-auto flex flex-col items-start gap-3 pt-2">
          <div className="flex flex-col w-full">
            {product.valor_promocional ? (
              <div className="flex flex-col">
                <span className={`text-xs line-through ${isDark ? 'text-gray-400' : 'text-slate-400'}`}>
                  R$ {Number(product.valor).toFixed(2).replace('.', ',')}
                </span>
                <span className={`font-display font-black text-xl md:text-2xl ${
                  isDark ? 'text-[#FFDE59]' : 'text-amber-600'
                }`}>
                  R$ {Number(product.valor_promocional).toFixed(2).replace('.', ',')}
                </span>
              </div>
            ) : (
              <span className={`font-display font-black text-xl md:text-2xl ${
                isDark ? 'text-[#00E5FF]' : 'text-[#0284C7]'
              }`}>
                R$ {Number(product.valor).toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>

          {/* Botão de Adição com Efeito Hover */}
          <button 
            onClick={handleCardClick}
            className="w-full py-3 px-4 rounded-xl font-display font-black text-xs uppercase tracking-wider bg-[#FFDE59] text-[#0A0F1D] hover:bg-yellow-400 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-yellow-500/10 cursor-pointer active:scale-95"
          >
            <Plus size={16} strokeWidth={3} />
            <span>Detalhes / Adicionar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
