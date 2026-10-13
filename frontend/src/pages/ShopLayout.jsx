import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Topbar from '../components/Topbar';
import Navbar from '../components/Navbar';
import Cart from '../components/Cart';
import Footer from '../components/Footer';
import { useThemeStore } from '../store/useThemeStore';

const ShopLayout = () => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  useEffect(() => {
    // Sincroniza a cor do body para suportar o overscroll mobile
    document.body.style.backgroundColor = isDark ? '#0A0F1D' : '#F8FAFC';
    return () => {
      // Ao sair para o /admin, restaura o fundo escuro operacional
      document.body.style.backgroundColor = '#0A0F1D';
    };
  }, [isDark]);

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${isDark ? 'bg-[#0A0F1D] text-white' : 'bg-[#F8FAFC] text-slate-900'}`}>
      <Cart />
      <Topbar />
      <Navbar />
      <main className="grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default ShopLayout;
