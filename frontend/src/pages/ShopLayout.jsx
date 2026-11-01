import { useEffect, useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Topbar from '../components/Topbar';
import Navbar from '../components/Navbar';
import Cart from '../components/Cart';
import Footer from '../components/Footer';
import { useThemeStore } from '../store/useThemeStore';
import supabase from '../supabaseClient';
import { ArrowLeft } from 'lucide-react';

const ShopLayout = () => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [hasAdminSession, setHasAdminSession] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Sincroniza a cor do body para suportar o overscroll mobile
    document.body.style.backgroundColor = isDark ? '#0A0F1D' : '#F8FAFC';
    return () => {
      // Ao sair para o /admin, restaura o fundo escuro operacional
      document.body.style.backgroundColor = '#0A0F1D';
    };
  }, [isDark]);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email === 'depositorefresca@gmail.com') {
          setHasAdminSession(true);
        }
      } catch (e) {}
    };
    checkAdmin();

    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(standalone);
  }, []);

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${isDark ? 'bg-[#0A0F1D] text-white' : 'bg-[#F8FAFC] text-slate-900'}`}>
      {/* Banner de Retorno ao Admin quando aberto a partir do Painel ou PWA Standalone */}
      {(hasAdminSession || isStandalone) && (
        <div className="sticky top-0 z-[110] bg-[#070B16] border-b border-[#00E5FF]/40 px-4 py-2 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] animate-pulse"></span>
            <span className="font-bold uppercase tracking-wider text-white">Visualizando Loja Pública</span>
            <span className="hidden sm:inline text-gray-400 font-medium">• Modo Gerente</span>
          </div>
          <Link
            to="/admin/orders"
            className="bg-[#00E5FF] hover:bg-[#00B4D8] text-[#0A0F1D] text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 active:scale-95"
          >
            <ArrowLeft size={14} /> Voltar ao Painel Admin
          </Link>
        </div>
      )}
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
