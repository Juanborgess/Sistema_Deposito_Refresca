import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Clock, ShieldCheck, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#070B16] text-gray-400 border-t border-white/10 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Coluna 1: Sobre & Logo */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src="/logo_refresca.png" alt="Refresca Bebidas" className="h-14 w-auto rounded-lg object-contain" />
              <div>
                <h3 className="text-white font-display font-black text-lg tracking-wider">REFRESCA</h3>
                <p className="text-xs text-[#00E5FF] font-bold tracking-widest uppercase">Depósito de Bebidas</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              O melhor preço da Barra da Tijuca. Cervejas estalando de gelada, destilados, refrigerantes, água, gelo e carvão com entrega rápida na sua porta.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#FFDE59] font-semibold pt-1">
              <ShieldCheck size={16} /> Bebidas 100% Originais e Lacradas
            </div>
          </div>

          {/* Coluna 2: Áreas Atendidas */}
          <div className="space-y-4">
            <h4 className="text-white font-display font-bold text-base uppercase tracking-wider">
              Áreas de Entrega
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]"></span> Barra da Tijuca toda (R$ 10,00)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]"></span> São Conrado (R$ 10,00)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]"></span> Gávea (R$ 12,00)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]"></span> Leblon (R$ 12,00)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]"></span> Ipanema (R$ 12,00)
              </li>
            </ul>
          </div>

          {/* Coluna 3: Horários e Localização */}
          <div className="space-y-4">
            <h4 className="text-white font-display font-bold text-base uppercase tracking-wider">
              Atendimento
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Clock size={18} className="text-[#00E5FF] shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Todos os dias (não fecha)</p>
                  <p className="text-xs text-gray-400">Das 08:00 às 23:00</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-[#00E5FF] shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Endereço:</p>
                  <p className="text-xs text-gray-400">Rua São Tillon, 141 - Barra da Tijuca, RJ</p>
                  <p className="text-[11px] text-gray-500">CEP: 22640-050</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={18} className="text-[#25D366] shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">WhatsApp Pedidos:</p>
                  <p className="text-xs text-gray-400">(21) 98378-5928</p>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna 4: Links Rápidos */}
          <div className="space-y-4">
            <h4 className="text-white font-display font-bold text-base uppercase tracking-wider">
              Links Rápidos
            </h4>
            <div className="flex flex-col space-y-2 text-sm">
              <Link 
                to="/" 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
                className="hover:text-[#00E5FF] transition-colors"
              >
                Início
              </Link>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  if (window.location.pathname !== '/') {
                    window.location.href = '/?section=catalogo';
                  } else {
                    const element = document.getElementById('catalogo');
                    if (element) {
                      const y = element.getBoundingClientRect().top + window.scrollY - 100;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                  }
                }}
                className="text-left hover:text-[#00E5FF] transition-colors"
              >
                Catálogo Completo
              </button>
              <Link 
                to="/rastreio" 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
                className="hover:text-[#00E5FF] transition-colors"
              >
                Rastrear meu Pedido
              </Link>
              <Link 
                to="/admin/login" 
                onClick={() => window.scrollTo(0,0)}
                className="text-xs text-gray-600 hover:text-gray-400 pt-4"
              >
                Acesso Administrativo
              </Link>
            </div>
          </div>

        </div>

        {/* Linha Inferior */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Distribuidora de Bebidas Refresca. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1">
            Bebidas com moderação. Proibida venda para menores de 18 anos.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
