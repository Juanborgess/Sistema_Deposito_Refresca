import React from 'react';

const Topbar = () => {
  const message = '⚡ BEBIDA ESTALANDO DE GELADA • GELO, ÁGUA & CARVÃO • MELHOR PREÇO DA BARRA DA TIJUCA • ENTREGA A DOMICÍLIO • TODOS OS DIAS DAS 08H ÀS 23H •';
  
  return (
    <div className="w-full bg-[#FFDE59] text-[#0A0F1D] py-1.5 overflow-hidden flex relative z-[100] font-black uppercase text-xs tracking-wider shadow-md">
      <div className="animate-marquee whitespace-nowrap flex font-display font-black text-xs tracking-wider">
        <span className="mx-6">{message}</span>
        <span className="mx-6">{message}</span>
        <span className="mx-6">{message}</span>
        <span className="mx-6">{message}</span>
      </div>
    </div>
  );
};

export default Topbar;
