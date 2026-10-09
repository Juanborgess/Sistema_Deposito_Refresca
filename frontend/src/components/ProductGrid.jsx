import React, { useState, useMemo, useEffect, useRef } from 'react';
import ProductCard from './ProductCard';
import { useSearchStore } from '../store/useSearchStore';
import { Search, Snowflake } from 'lucide-react';
import api from '../services/api';

const ProductGrid = () => {
  const [activeCategory, setActiveCategory] = useState('');
  const [productsData, setProductsData] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { searchTerm, setSearchTerm, clearSearch } = useSearchStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get('/products'),
          api.get('/categories').catch(() => ({ data: [] }))
        ]);
        
        const mappedProducts = (prodRes.data || []).map(p => ({
          ...p,
          valor: p.valor_promocional ? Number(p.valor_promocional) : Number(p.valor),
          valorOriginal: Number(p.valor),
          imagem: p.imagem_url,
        }));
        
        setProductsData(mappedProducts);
        setCategoriesData(catRes.data || []);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Obter categorias e agrupar produtos
  const { categories, groupedProducts } = useMemo(() => {
    const groups = {};
    
    const normalizeString = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";

    const filteredProducts = productsData.filter(p => {
      if (!searchTerm) return true;
      const term = normalizeString(searchTerm);
      return normalizeString(p.nome).includes(term) || normalizeString(p.categoria).includes(term);
    });

    filteredProducts.forEach(p => {
      const cat = p.categoria || 'Sem Categoria';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    
    const activeCats = Object.keys(groups);
    
    // Sort categories based on the DB order from categoriesData
    const sortedCats = activeCats.sort((a, b) => {
      const catA = categoriesData.find(c => c.nome === a);
      const catB = categoriesData.find(c => c.nome === b);
      const orderA = catA && catA.ordem !== undefined ? catA.ordem : 999;
      const orderB = catB && catB.ordem !== undefined ? catB.ordem : 999;
      return orderA - orderB;
    });

    return { 
      categories: sortedCats, 
      groupedProducts: groups 
    };
  }, [productsData, categoriesData, searchTerm]);

  // Inicializar activeCategory
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  // Scroll Spy para atualizar a aba ativa
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 250; // Offset for the sticky header
      
      let currentActive = categories.length > 0 ? categories[0] : '';
      
      for (const category of categories) {
        const element = document.getElementById(`category-${category}`);
        if (element) {
          const elementY = element.getBoundingClientRect().top + window.scrollY;
          if (elementY <= scrollPosition) {
            currentActive = category;
          }
        }
      }
      
      setActiveCategory(currentActive);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categories]);

  // Scroll horizontal automático para manter a aba visível no menu
  const navRef = useRef(null);
  useEffect(() => {
    if (navRef.current && activeCategory) {
      const activeBtn = navRef.current.querySelector(`button[data-category="${activeCategory.replace(/"/g, '\\"')}"]`);
      if (activeBtn) {
        const container = navRef.current;
        const scrollLeft = activeBtn.offsetLeft - (container.offsetWidth / 2) + (activeBtn.offsetWidth / 2);
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [activeCategory]);

  const handleScrollTo = (category) => {
    setActiveCategory(category);
    const el = document.getElementById(`category-${category}`);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 180; // Offset for sticky Navbar + Category Bar
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <section id="catalogo" className="w-full bg-[#0A0F1D] relative z-10 pb-20">
      
      {/* Sticky Category Navbar */}
      <div className="sticky top-[72px] md:top-20 z-40 bg-[#0A0F1D]/95 backdrop-blur-md border-b border-white/5 py-3 w-full shadow-lg transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
          <div ref={navRef} className="flex flex-row overflow-x-auto custom-scrollbar gap-4 md:gap-8 w-full scroll-smooth">
            {categories.map(cat => (
              <button
                key={cat}
                data-category={cat}
                onClick={() => handleScrollTo(cat)}
                className={`whitespace-nowrap pb-2 text-xs md:text-sm font-bold font-display uppercase tracking-wider transition-all duration-300 border-b-2 ${
                  activeCategory === cat 
                    ? 'border-[#00E5FF] text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]' 
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {/* Header Section (Title & Search) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E5FF]/15 border border-[#00E5FF]/30 text-[#00E5FF] text-xs font-bold uppercase tracking-widest mb-3">
              <Snowflake size={14} className="animate-spin text-[#00E5FF]" /> Trincando de Gelada
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-black uppercase tracking-wider text-white">
              Catálogo <span className="text-[#00E5FF]">Completo</span>
            </h2>
            <p className="text-gray-400 text-sm md:text-base mt-2">
              Navegue pelas categorias e escolha suas bebidas.
            </p>
            {searchTerm && (
              <div className="mt-4 flex items-center flex-wrap gap-4 bg-white/5 border border-[#00E5FF]/30 p-3 rounded-xl w-fit">
                <span className="text-white text-sm font-medium">
                  Buscando: <strong className="text-[#00E5FF]">{searchTerm}</strong>
                </span>
                <button 
                  onClick={clearSearch} 
                  className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors px-3 py-1 rounded text-xs font-bold uppercase tracking-wider"
                >
                  Limpar
                </button>
              </div>
            )}
          </div>

          {/* Input de Busca */}
          <div className="w-full md:w-80 relative">
            <input
              type="text"
              placeholder="Buscar bebida..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#101935] border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF] transition-colors"
            />
            <Search size={18} className="absolute left-4 top-4 text-gray-500" />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-16 md:gap-24">
            {[1, 2, 3].map(i => (
              <div key={`skeleton-cat-${i}`}>
                <div className="w-48 h-8 bg-[#101935] rounded-xl animate-pulse mb-8"></div>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {[1, 2, 3, 4].map(j => (
                    <div key={`skeleton-card-${i}-${j}`} className="aspect-[3/4] bg-[#101935] rounded-3xl animate-pulse"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 bg-[#101935]/40 rounded-3xl border border-white/5 p-8">
            <div className="w-16 h-16 rounded-full bg-[#101935] flex items-center justify-center mx-auto mb-4 text-gray-500">
              <Search size={32} className="text-[#00E5FF]/40" />
            </div>
            <h3 className="text-white font-display font-bold text-xl mb-1 uppercase tracking-wider">Nenhum produto encontrado</h3>
            <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">
              Não conseguimos encontrar nenhum produto com o termo <strong className="text-[#00E5FF]">"{searchTerm}"</strong>.
            </p>
            <button 
              onClick={clearSearch} 
              className="bg-[#00E5FF] text-[#0A0F1D] font-bold uppercase tracking-widest text-xs px-6 py-3 rounded-full hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
            >
              Ver Catálogo Completo
            </button>
          </div>
        ) : (
          /* Categoria Sections */
          <div className="flex flex-col gap-12 md:gap-20">
            {categories.map(category => (
              <div key={category} id={`category-${category}`} className="scroll-mt-[200px]">
                <div className="flex items-center gap-4 mb-6">
                  <h3 className="text-xl md:text-3xl text-white font-black font-display uppercase tracking-wider">
                    {category}
                  </h3>
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-[#00E5FF]/50 to-transparent rounded-full"></div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {groupedProducts[category].map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
      </div>
    </section>
  );
};

export default ProductGrid;

