import React, { useState, useEffect } from 'react';
import { ArrowRight, MessageCircle, Zap, ShieldCheck, Clock, Snowflake, MapPin } from 'lucide-react';
import api from '../services/api';

const HeroSection = () => {
  const [isStoreOpen, setIsStoreOpen] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await api.get('/config');
        if (data && data.horario_abertura) {
          const now = new Date();
          const currentDay = now.getDay();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          
          const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

          const isOpenDay = (data.dias_funcionamento || [0,1,2,3,4,5,6]).includes(currentDay);
          
          let isOpenTime = true;
          if (data.horario_abertura && data.horario_fechamento) {
            const abre = data.horario_abertura.substring(0, 5);
            const fecha = data.horario_fechamento.substring(0, 5);
            
            if (abre <= fecha) {
              isOpenTime = currentTimeStr >= abre && currentTimeStr <= fecha;
            } else {
              isOpenTime = currentTimeStr >= abre || currentTimeStr <= fecha;
            }
          }
          setIsStoreOpen(isOpenDay && isOpenTime);
        }
      } catch (error) {
        console.error('Erro ao buscar config:', error);
      }
    };
    fetchConfig();
  }, []);

  const scrollToCatalog = () => {
    const el = document.getElementById('catalogo');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="relative overflow-hidden pt-8 pb-16 md:py-24">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00E5FF]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-[#FFDE59]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Lado Esquerdo: Textos & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Tag Superior */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#101935] border border-[#00E5FF]/30 text-white text-xs font-bold uppercase tracking-wider shadow-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] animate-pulse" />
              <span>Depósito na Barra da Tijuca</span>
              <span className="text-gray-500">•</span>
              <span className="text-[#FFDE59]">Aberto até 23h</span>
            </div>

            {/* Headline Principal */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black uppercase tracking-tight text-white leading-none">
              Sua Bebida <br />
              <span className="text-[#00E5FF] text-glow-cyan">Estalando de Gelada</span> <br />
              na Sua Porta
            </h1>

            {/* Descrição */}
            <p className="text-gray-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
              O melhor preço da Barra da Tijuca. Cervejas nacionais e importadas, destilados, combos, gelo, água mineral e carvão com entrega rápida.
            </p>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={scrollToCatalog}
                className="w-full sm:w-auto bg-[#FFDE59] hover:bg-yellow-400 text-[#0A0F1D] font-display font-black text-sm uppercase tracking-wider px-8 py-4 rounded-2xl shadow-xl shadow-yellow-500/10 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                Ver Cardápio de Bebidas <ArrowRight size={18} />
              </button>

              <a
                href="https://wa.me/5521983785928?text=Ol%C3%A1!%20Vim%20pelo%20site%20do%20Refresca%20e%20gostaria%20de%20fazer%20um%20pedido."
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto bg-[#101935] hover:bg-[#152244] text-white border border-white/10 hover:border-[#00E5FF]/40 font-display font-bold text-sm uppercase tracking-wider px-6 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
              >
                <MessageCircle size={20} className="text-[#25D366]" /> Pedir no WhatsApp
              </a>
            </div>

            {/* Badges de Confiança */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 max-w-lg mx-auto lg:mx-0">
              <div className="flex items-center gap-2 text-left">
                <Zap size={20} className="text-[#00E5FF] shrink-0" />
                <div>
                  <p className="text-white text-xs font-bold leading-tight">Entrega Rápida</p>
                  <p className="text-[10px] text-gray-400">Barra & Zona Sul</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-left">
                <Snowflake size={20} className="text-[#00E5FF] shrink-0" />
                <div>
                  <p className="text-white text-xs font-bold leading-tight">Gelo & Carvão</p>
                  <p className="text-[10px] text-gray-400">Churrasco completo</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-left">
                <Clock size={20} className="text-[#FFDE59] shrink-0" />
                <div>
                  <p className="text-white text-xs font-bold leading-tight">08h às 23h</p>
                  <p className="text-[10px] text-gray-400">Segunda a Domingo</p>
                </div>
              </div>
            </div>

          </div>

          {/* Lado Direito: Card em Destaque com o Logo do Refresca */}
          <div className="lg:col-span-5 flex justify-center relative">
            <div className="relative w-full max-w-md">
              {/* Moldura Glassmorphism com Efeito de Glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#00E5FF]/20 to-[#FFDE59]/10 rounded-3xl blur-2xl pointer-events-none" />
              
              <div className="relative bg-[#101935] border border-white/15 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center space-y-6">
                <div className="relative mx-auto w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[#00E5FF]/15 rounded-full blur-2xl animate-pulse" />
                  <img 
                    src="/logo_refresca.png" 
                    alt="Refresca Bebidas" 
                    className="w-full h-full object-contain relative z-10 drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]"
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="font-display font-black text-2xl text-white uppercase tracking-wider">
                    Depósito Refresca
                  </h3>
                  <div className="flex items-center justify-center gap-2 text-xs text-[#00E5FF] font-semibold">
                    <MapPin size={14} /> Rua São Tillon, 141 - Barra da Tijuca
                  </div>
                </div>

                <div className="bg-[#0A0F1D] border border-white/5 rounded-2xl p-4 flex justify-between items-center text-xs">
                  <div className="text-left">
                    <span className="text-gray-400 block">{isStoreOpen ? 'Tempo Estimado' : 'Horário de Funcionamento'}</span>
                    <span className="text-white font-bold">{isStoreOpen ? 'Entrega em até 45 min' : '08:00 às 23:00'}</span>
                  </div>
                  {isStoreOpen ? (
                    <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold uppercase text-[10px]">
                      ● Loja Aberta
                    </span>
                  ) : (
                    <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full font-bold uppercase text-[10px]">
                      ● Loja Fechada
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
