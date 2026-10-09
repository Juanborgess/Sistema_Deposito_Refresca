import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X, MessageCircle, MapPin } from 'lucide-react';
import useCartStore from '../store/cartStore';

const Navbar = () => {
  const cartItemsCount = useCartStore(state => state.getTotalItems());
  const toggleCart = useCartStore(state => state.toggleCart);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoClick = () => {
    if (location.pathname !== '/') {
      navigate('/');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const scrollToSection = (e, id) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    
    if (id === 'whatsapp') {
      window.open('https://wa.me/5521983785928?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20Refresca%20e%20gostaria%20de%20fazer%20um%20pedido.', '_blank');
      return;
    }

    if (location.pathname !== '/') {
      navigate(id === 'top' ? '/' : `/?section=${id}`);
      return;
    }
    
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.getElementById(id);
      if (element) {
        const y = element.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-[#0A0F1D]/90 backdrop-blur-md border-b border-white/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
          
            {/* Visão Mobile */}
            <div className="md:hidden flex items-center justify-between w-full">
              <a href="/" onClick={(e) => { e.preventDefault(); handleLogoClick(); }} className="flex-shrink-0 flex items-center gap-2">
                <img src="/logo_refresca.png" alt="Refresca Bebidas" className="h-14 w-auto object-contain rounded-lg drop-shadow-[0_0_10px_rgba(0,229,255,0.3)]" />
                <div className="flex flex-col">
                  <span className="font-display font-black text-sm tracking-wider text-white">REFRESCA</span>
                  <span className="text-[9px] font-bold tracking-widest text-[#00E5FF]">BEBIDAS</span>
                </div>
              </a>
              <div className="flex items-center gap-4">
                <button 
                  onClick={toggleCart} 
                  className="text-white hover:text-[#00E5FF] transition-colors relative p-2"
                  aria-label="Abrir carrinho"
                >
                  <ShoppingBag size={24} />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#FFDE59] text-[#0A0F1D] text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-lg">
                      {cartItemsCount}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-white hover:text-[#00E5FF] transition-colors p-1"
                  aria-label="Menu"
                >
                  {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
              </div>
            </div>

            {/* Visão Desktop */}
            <div className="hidden md:flex justify-between items-center w-full">
              
              {/* Links da Esquerda */}
              <div className="flex items-center gap-6 font-medium text-sm lg:text-base text-gray-300">
                <a href="#" onClick={(e) => scrollToSection(e, 'top')} className="hover:text-[#00E5FF] transition-colors">Início</a>
                <a href="#catalogo" onClick={(e) => scrollToSection(e, 'catalogo')} className="hover:text-[#00E5FF] transition-colors">Catálogo</a>
                <Link to="/rastreio" className="hover:text-[#00E5FF] transition-colors flex items-center gap-2 border border-white/10 px-3 py-1.5 rounded-full hover:border-[#00E5FF]/40 text-sm">
                  Rastrear Pedido
                </Link>
              </div>

              {/* Logo Centralizada */}
              <a href="/" onClick={(e) => { e.preventDefault(); handleLogoClick(); }} className="flex items-center gap-3 absolute left-1/2 transform -translate-x-1/2 transition-transform hover:scale-105 active:scale-95">
                <img src="/logo_refresca.png" alt="Refresca Bebidas" className="h-16 w-auto object-contain drop-shadow-[0_0_15px_rgba(0,229,255,0.4)]" />
              </a>

              {/* Ações da Direita */}
              <div className="flex items-center gap-6">
                <button 
                  onClick={(e) => scrollToSection(e, 'catalogo')} 
                  className="text-white hover:text-[#00E5FF] transition-colors" 
                  title="Buscar produtos"
                >
                  <Search size={22} />
                </button>
                <a 
                  href="#" 
                  onClick={(e) => scrollToSection(e, 'whatsapp')} 
                  className="text-white hover:text-[#25D366] transition-colors flex items-center gap-2 text-xs font-black uppercase tracking-widest border border-white/5 bg-white/5 px-3 py-1.5 rounded-xl hover:border-[#25D366]/40 hover:bg-[#25D366]/10"
                >
                  <MessageCircle size={18} className="text-[#25D366]" />
                  <span className="hidden lg:inline">Pedir pelo ZAP</span>
                </a>
                <button 
                  onClick={toggleCart} 
                  className="text-white hover:text-[#00E5FF] transition-colors relative p-2 bg-[#101935] border border-white/10 hover:border-[#00E5FF]/40 rounded-xl flex items-center gap-2 px-4 py-2"
                >
                  <ShoppingBag size={20} className="text-[#00E5FF]" />
                  <span className="text-sm font-bold">Carrinho</span>
                  {cartItemsCount > 0 && (
                    <span className="bg-[#FFDE59] text-[#0A0F1D] text-[11px] font-black px-2 py-0.5 rounded-full">
                      {cartItemsCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#0A0F1D] border-b border-white/10 px-6 py-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <a 
              href="#" 
              onClick={(e) => scrollToSection(e, 'top')} 
              className="block text-white hover:text-[#00E5FF] font-medium text-lg py-2"
            >
              Início
            </a>
            <a 
              href="#catalogo" 
              onClick={(e) => scrollToSection(e, 'catalogo')} 
              className="block text-white hover:text-[#00E5FF] font-medium text-lg py-2"
            >
              Catálogo de Bebidas
            </a>
            <Link 
              to="/rastreio" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="block text-white hover:text-[#00E5FF] font-medium text-lg py-2"
            >
              Rastrear Pedido
            </Link>
            <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
              <a 
                href="https://wa.me/5521983785928" 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center justify-center gap-2 bg-[#25D366] text-black font-bold py-3 rounded-xl uppercase text-sm tracking-wider"
              >
                <MessageCircle size={20} /> Pedir pelo WhatsApp
              </a>
              <div className="text-xs text-gray-400 flex items-center justify-center gap-1.5 pt-2">
                <MapPin size={14} className="text-[#00E5FF]" /> Rua São Tillon, 141 - Barra da Tijuca
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
