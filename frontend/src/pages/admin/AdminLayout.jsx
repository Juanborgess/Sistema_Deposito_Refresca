import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import supabase from '../../supabaseClient';
import { 
  Menu, X, BellRing, LogOut, LayoutDashboard, ShoppingBag, 
  Package, Tags, Users, Ticket, Truck, Clock, RefreshCw 
} from 'lucide-react';
import toast from 'react-hot-toast';

// Instância global para destravar áudio do navegador
let globalAudioCtx = null;
const initAudioContext = () => {
  if (!globalAudioCtx) {
    globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume();
  }
};

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Inicializa áudio no primeiro clique/toque do usuário
  useEffect(() => {
    window.addEventListener('click', initAudioContext, { once: true });
    window.addEventListener('touchstart', initAudioContext, { once: true });
    return () => {
      window.removeEventListener('click', initAudioContext);
      window.removeEventListener('touchstart', initAudioContext);
    };
  }, []);

  // Solicita permissão de notificação do sistema operacional
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  // Escuta novos pedidos em tempo real (Supabase Realtime WebSockets)
  useEffect(() => {
    const playNotificationSound = () => {
      try {
        const audio = new Audio('/sounds/notificacao_refresca.mp3');
        audio.play().catch((err) => {
          console.warn('Áudio de notificação bloqueado pelo navegador.', err);
        });
      } catch (err) {
        console.error('Erro ao tocar áudio', err);
      }
    };

    const channel = supabase
      .channel('admin-orders-alert')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, (payload) => {
        playNotificationSound();
        
        // Dispara notificação nativa do Windows/Android
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Novo Pedido no Refresca Bebidas!', {
            body: `Pedido #${String(payload.new.codigo_pedido).padStart(4, '0')} • R$ ${Number(payload.new.total).toFixed(2).replace('.', ',')}`,
            icon: '/logo_refresca.png'
          });
        }

        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-[#101935] border border-[#00E5FF]/40 shadow-2xl rounded-2xl pointer-events-auto flex p-4 items-center gap-4`}>
            <div className="w-10 h-10 rounded-full bg-[#00E5FF]/20 text-[#00E5FF] flex items-center justify-center shrink-0">
              <BellRing className="animate-bounce" size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#00E5FF] uppercase tracking-wider">Novo Pedido Recebido!</p>
              <p className="text-sm text-white font-bold truncate">
                Pedido #{String(payload.new.codigo_pedido).padStart(4, '0')} • R$ {Number(payload.new.total).toFixed(2).replace('.', ',')}
              </p>
              <p className="text-xs text-gray-400">{payload.new.bairro}</p>
            </div>
            <button
              onClick={() => { toast.dismiss(t.id); navigate('/admin/orders'); }}
              className="bg-[#00E5FF] text-[#0A0F1D] px-3 py-1.5 rounded-xl font-bold text-xs uppercase"
            >
              Ver
            </button>
          </div>
        ), { duration: 10000 });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Painel Geral', path: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Pedidos (Kanban)', path: '/admin/orders', icon: <ShoppingBag size={18} /> },
    { label: 'Catálogo de Bebidas', path: '/admin/catalog', icon: <Package size={18} /> },
    { label: 'Motoboys', path: '/admin/motoboys', icon: <Users size={18} /> },
    { label: 'Taxas de Frete', path: '/admin/shipping', icon: <Truck size={18} /> },
    { label: 'Configurações da Loja', path: '/admin/schedule', icon: <Clock size={18} /> },
    { label: 'Cupons', path: '/admin/coupons', icon: <Ticket size={18} /> },
    { label: 'Clientes (CRM)', path: '/admin/customers', icon: <Users size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-[#0A0F1D] flex flex-col lg:flex-row text-white font-sans overflow-x-hidden">
      
      {/* Sidebar Desktop (Telas Grandes lg+) */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#070B16] border-r border-white/10 p-5 shrink-0 justify-between sticky top-0 h-screen">
        <div className="space-y-6">
          <Link to="/admin/dashboard" className="flex items-center gap-3 px-2">
            <img src="/logo_refresca.png" alt="Refresca Bebidas" className="h-11 w-auto object-contain rounded-lg" />
            <div>
              <span className="font-display font-black text-sm text-white tracking-wider block">REFRESCA</span>
              <span className="text-[10px] text-[#00E5FF] font-bold tracking-widest uppercase block">Painel Gerente</span>
            </div>
          </Link>

          {/* Navegação */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-[#00E5FF] text-[#0A0F1D] shadow-lg shadow-cyan-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Rodapé da Sidebar */}
        <div className="pt-4 border-t border-white/10 space-y-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-[#00E5FF] px-3 py-2 transition-colors font-medium"
          >
            Ver Loja Pública
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut size={16} /> Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Topbar Mobile & Tablet / Split-Screen */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-[#070B16]/95 backdrop-blur-md border-b border-white/10">
        <Link to="/admin/dashboard" className="flex items-center gap-2.5">
          <img src="/logo_refresca.png" alt="Refresca" className="h-9 w-auto object-contain rounded-md" />
          <div>
            <span className="font-display font-black text-xs sm:text-sm text-white block leading-none">REFRESCA ADMIN</span>
            <span className="text-[9px] text-[#00E5FF] font-bold uppercase tracking-widest">Gestão Express</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/orders"
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
              location.pathname === '/admin/orders'
                ? 'bg-[#00E5FF] text-[#0A0F1D]'
                : 'bg-white/5 text-gray-300 hover:text-white'
            }`}
          >
            <ShoppingBag size={14} /> Pedidos
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Menu Drawer Mobile & Tablet */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[57px] z-40 bg-[#070B16] border-b border-white/10 p-4 space-y-1 shadow-2xl max-h-[calc(100vh-57px)] overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-[#00E5FF] text-[#0A0F1D]'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 text-xs font-bold text-[#00E5FF]"
            >
              Abrir Loja Pública ↗
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase text-red-400 hover:bg-red-500/10 rounded-xl"
            >
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo Principal das Telas Admin */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar">
        <Outlet />
      </main>

    </div>
  );
};

export default AdminLayout;
