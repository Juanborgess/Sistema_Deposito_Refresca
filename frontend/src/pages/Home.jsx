import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import FeaturedCarousel from '../components/FeaturedCarousel';
import ProductGrid from '../components/ProductGrid';
import LocalSEOSection from '../components/LocalSEOSection';

const Home = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const section = searchParams.get('section');
    if (section) {
      setTimeout(() => {
        const element = document.getElementById(section);
        if (element) {
          const y = element.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 500); // Wait for products to load
    }
  }, [searchParams]);

  return (
    <>
      <Helmet>
        <title>Refresca Bebidas | Depósito & Delivery Barra da Tijuca, São Conrado e Zona Sul</title>
        <meta 
          name="description" 
          content="Depósito de Bebidas na Barra da Tijuca. Delivery de Cervejas estalando de gelada, Destilados, Vinhos, Energéticos, Gelo e Carvão. Peça já pelo WhatsApp!" 
        />
        <meta property="og:title" content="Refresca Bebidas | Cerveja Trincando de Gelada e Delivery" />
        <meta property="og:description" content="O melhor preço da Barra da Tijuca. Entregas expressas em até 1 hora no RJ!" />
        <meta property="og:image" content="/logo_refresca.png" />
      </Helmet>

      <h1 className="sr-only">
        Distribuidora e Depósito de Bebidas Refresca - Entrega de Cerveja Gelada, Gelo e Carvão na Barra da Tijuca
      </h1>

      <HeroSection />
      <FeaturedCarousel />
      <ProductGrid />
      <LocalSEOSection />
    </>
  );
};

export default Home;
