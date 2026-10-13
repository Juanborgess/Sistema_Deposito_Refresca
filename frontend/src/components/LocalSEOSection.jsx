import React, { useState } from 'react';
import { Truck, ShieldCheck, CreditCard, ChevronDown, MapPin, Zap, Clock, Snowflake, Beer } from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';

const faqs = [
  {
    pergunta: "Onde comprar cerveja trincando de gelada na Barra da Tijuca com entrega rápida?",
    resposta: "Na Distribuidora de Bebidas Refresca você encontra cervejas nacionais e artesanais estalando de geladas com entrega expressa via motoboy na Barra da Tijuca, São Conrado, Gávea, Leblon e Ipanema. Despachamos em minutos direto do nosso depósito na Rua São Tillon, 141."
  },
  {
    pergunta: "Vocês entregam saco de gelo, água mineral e carvão para churrasco?",
    resposta: "Sim! Nosso depósito é completo para seu churrasco e festa: temos sacos de gelo em cubo e escama, carvão de alta qualidade, água mineral de 500ml e galão, energéticos, refrigerantes e descartáveis."
  },
  {
    pergunta: "Qual o horário de funcionamento do Depósito Refresca?",
    resposta: "Atendemos de segunda a domingo, das 08:00 às 23:00, sem fechar em feriados. Se fizer seu pedido fora desse horário pelo site, ele é agendado automaticamente para a primeira entrega das 08h."
  },
  {
    pergunta: "Quais bairros do Rio de Janeiro têm entrega do Refresca Bebidas?",
    resposta: "Entregamos com taxas fixas e ágeis em toda a Barra da Tijuca (R$ 10,00), São Conrado (R$ 10,00), Gávea (R$ 12,00), Leblon (R$ 12,00) e Ipanema (R$ 12,00)."
  },
  {
    pergunta: "Como fazer um pedido de bebidas pelo WhatsApp?",
    resposta: "Basta selecionar suas cervejas, destilados ou combos aqui no nosso catálogo online, informar seu endereço e clicar em 'Concluir no WhatsApp'. O atendente recebe o resumo completo com valores e envia o motoboy imediatamente."
  },
  {
    pergunta: "Quais são as formas de pagamento aceitas?",
    resposta: "Aceitamos PIX (Chave: 21992962260), Cartão de Crédito e Débito na maquininha levada pelo motoboy, e Dinheiro em espécie (com troco solicitado no checkout)."
  }
];

const bairrosDestaque = [
  "Barra da Tijuca", "São Conrado", "Gávea", "Leblon", "Ipanema", "Jardim Oceânico", "Joá", "Itanhangá"
];

const LocalSEOSection = () => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((f) => ({
      "@type": "Question",
      "name": f.pergunta,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.resposta
      }
    }))
  };

  return (
    <section className={`relative z-20 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t ${isDark ? 'border-white/5' : 'border-slate-200'} transition-colors duration-300`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Grid de Diferenciais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <div className={`${isDark ? 'bg-[#101935] border-white/5' : 'bg-white border-slate-200/80 shadow-sm'} border rounded-2xl p-6 flex flex-col gap-3 transition-colors duration-300`}>
          <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-[#00E5FF]/10 text-[#00E5FF]' : 'bg-cyan-50 text-cyan-600'} flex items-center justify-center`}>
            <Snowflake size={24} />
          </div>
          <h3 className={`${isDark ? 'text-white' : 'text-slate-900'} font-display font-bold text-base`}>Bebida Trincando</h3>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-600'} leading-relaxed`}>
            Nossas câmaras frias mantêm a cerveja na temperatura ideal para consumo imediato.
          </p>
        </div>

        <div className={`${isDark ? 'bg-[#101935] border-white/5' : 'bg-white border-slate-200/80 shadow-sm'} border rounded-2xl p-6 flex flex-col gap-3 transition-colors duration-300`}>
          <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-[#FFDE59]/10 text-[#FFDE59]' : 'bg-amber-50 text-amber-600'} flex items-center justify-center`}>
            <Truck size={24} />
          </div>
          <h3 className={`${isDark ? 'text-white' : 'text-slate-900'} font-display font-bold text-base`}>Entrega Expressa</h3>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-600'} leading-relaxed`}>
            Motoboys próprios dedicados para Barra da Tijuca, São Conrado e Zona Sul.
          </p>
        </div>

        <div className={`${isDark ? 'bg-[#101935] border-white/5' : 'bg-white border-slate-200/80 shadow-sm'} border rounded-2xl p-6 flex flex-col gap-3 transition-colors duration-300`}>
          <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-[#00E5FF]/10 text-[#00E5FF]' : 'bg-cyan-50 text-cyan-600'} flex items-center justify-center`}>
            <Clock size={24} />
          </div>
          <h3 className={`${isDark ? 'text-white' : 'text-slate-900'} font-display font-bold text-base`}>Aberto até 23h</h3>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-600'} leading-relaxed`}>
            De segunda a domingo, das 08h às 23h, para salvar seu churrasco e rolê.
          </p>
        </div>

        <div className={`${isDark ? 'bg-[#101935] border-white/5' : 'bg-white border-slate-200/80 shadow-sm'} border rounded-2xl p-6 flex flex-col gap-3 transition-colors duration-300`}>
          <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'} flex items-center justify-center`}>
            <CreditCard size={24} />
          </div>
          <h3 className={`${isDark ? 'text-white' : 'text-slate-900'} font-display font-bold text-base`}>Pagamento Facilitado</h3>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-600'} leading-relaxed`}>
            PIX imediato, Cartões na maquininha ou Dinheiro com troco na entrega.
          </p>
        </div>
      </div>

      {/* Seção de Bairros Atendidos */}
      <div className={`${isDark ? 'bg-[#101935] border-white/10 shadow-lg' : 'bg-white border-slate-200 shadow-sm'} border rounded-3xl p-8 mb-16 text-center transition-colors duration-300`}>
        <h3 className={`text-xl md:text-2xl font-display font-black uppercase ${isDark ? 'text-white' : 'text-slate-900'} mb-3`}>
          Cobertura de Entrega no Rio de Janeiro
        </h3>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-600'} max-w-2xl mx-auto mb-6`}>
          Atendemos condomínios, residências e praias da Barra da Tijuca e principais bairros da Zona Sul com rapidez.
        </p>
        <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
          {bairrosDestaque.map((b) => (
            <span key={b} className={`${isDark ? 'bg-[#0A0F1D] border-white/10 text-gray-300' : 'bg-slate-100 border-slate-200 text-slate-700'} border text-xs font-semibold px-4 py-2 rounded-xl`}>
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="text-center mb-8">
          <h3 className={`text-2xl font-display font-black uppercase ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>
            Perguntas <span className={isDark ? "text-[#00E5FF]" : "text-cyan-600"}>Frequentes</span>
          </h3>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Tudo o que você precisa saber sobre nosso depósito e entrega.</p>
        </div>

        {faqs.map((faq, idx) => (
          <div 
            key={idx}
            className={`${isDark ? 'bg-[#101935] border-white/5' : 'bg-white border-slate-200/80 shadow-sm'} border rounded-2xl overflow-hidden transition-colors duration-200`}
          >
            <button
              onClick={() => toggleFaq(idx)}
              className={`w-full p-5 text-left flex justify-between items-center gap-4 ${isDark ? 'text-white hover:text-[#00E5FF]' : 'text-slate-800 hover:text-cyan-600'} font-medium text-sm transition-colors`}
            >
              <span>{faq.pergunta}</span>
              <ChevronDown 
                size={18} 
                className={`transition-transform ${openFaqIndex === idx ? 'rotate-180 ' + (isDark ? 'text-[#00E5FF]' : 'text-cyan-600') : (isDark ? 'text-gray-400' : 'text-slate-400')}`} 
              />
            </button>
            {openFaqIndex === idx && (
              <div className={`px-5 pb-5 text-xs ${isDark ? 'text-gray-400 border-white/5' : 'text-slate-600 border-slate-100'} leading-relaxed border-t pt-3`}>
                {faq.resposta}
              </div>
            )}
          </div>
        ))}
      </div>

    </section>
  );
};

export default LocalSEOSection;
