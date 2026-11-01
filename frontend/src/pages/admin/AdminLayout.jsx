import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import supabase from '../../supabaseClient';
import { 
  Menu, X, BellRing, LogOut, LayoutDashboard, ShoppingBag, 
  Package, Tags, Users, Ticket, Truck, Clock, RefreshCw, Download,
  Bell, Volume2, Printer 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePWAStore } from '../../store/usePWAStore';
import { autoPrintThermalReceipt } from '../../utils/thermalPrinter';

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
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches || 
    window.navigator.standalone === true
  );
  const { promptInstall } = usePWAStore();

  const [notificationPermission, setNotificationPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  // Controle de Impressão Automática de Notinhas (Ativado por padrão)
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('refresca_auto_print') : null;
    return saved !== null ? saved === 'true' : true;
  });

  const autoPrintRef = useRef(autoPrintEnabled);
  useEffect(() => {
    autoPrintRef.current = autoPrintEnabled;
  }, [autoPrintEnabled]);

  const toggleAutoPrint = () => {
    setAutoPrintEnabled((prev) => {
      const nextVal = !prev;
      localStorage.setItem('refresca_auto_print', String(nextVal));
      if (nextVal) {
        toast.success('🖨️ Auto-impressão de notinhas ATIVADA!');
      } else {
        toast('⏸️ Auto-impressão de notinhas PAUSADA.', { icon: '🖨️' });
      }
      return nextVal;
    });
  };

  // Inicializa áudio no primeiro clique/toque do usuário
  useEffect(() => {
    window.addEventListener('click', initAudioContext, { once: true });
    window.addEventListener('touchstart', initAudioContext, { once: true });
    return () => {
      window.removeEventListener('click', initAudioContext);
      window.removeEventListener('touchstart', initAudioContext);
    };
  }, []);

  const handleEnableNotifications = async () => {
    initAudioContext();
    try {
      const audio = new Audio('/sounds/notificacao_refresca.mp3');
      await audio.play();
    } catch (e) {
      console.warn('Erro ao tocar som:', e);
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
          new Notification('🔔 Notificações Ativadas - Refresca!', {
            body: 'O som e os alertas de pedidos vão avisar no seu notebook mesmo em segundo plano.',
            icon: '/pwa-192x192.png'
          });
          toast.success('🔔 Notificações e som ativados com sucesso no notebook!');
        } else if (permission === 'denied') {
          toast.error('Notificação bloqueada. Clique no ícone de configurações ao lado do link no navegador para permitir.');
        }
      } catch (err) {
        console.error('Erro ao pedir permissão de notificação:', err);
      }
    } else {
      toast.success('🔊 Som do sistema desbloqueado com sucesso!');
    }
  };

  const handleTestSound = () => {
    initAudioContext();
    try {
      const audio = new Audio('/sounds/notificacao_refresca.mp3');
      audio.play();
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('🔊 Teste de Som - Refresca Bebidas', {
          body: 'Seu notebook está configurado e pronto para alertar novos pedidos!',
          icon: '/pwa-192x192.png'
        });
      }
      toast.success('🔊 Som testado com sucesso no notebook!');
    } catch (err) {
      toast.error('Erro ao tocar áudio. Clique na tela para desbloquear o som.');
    }
  };

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
            icon: '/pwa-192x192.png'
          });
        }

        // Auto-impressão da comanda na impressora térmica (se ativado)
        if (autoPrintRef.current) {
          autoPrintThermalReceipt(payload.new, supabase);
        }

        // Notifica tela de pedidos para atualizar instantaneamente na coluna RECEBIDO
        window.dispatchEvent(new CustomEvent('refresca:novo-pedido', { detail: payload.new }));

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
    <div className="min-h-screen bg-[#0A0F1D] flex flex-col md:flex-row text-white font-sans overflow-x-hidden">
      
      {/* Sidebar Desktop (Telas md+ 768px+) */}
      <aside className="hidden md:flex flex-col w-60 lg:w-64 bg-[#070B16] border-r border-white/10 p-5 shrink-0 justify-between sticky top-0 h-screen">
        <div className="space-y-4">
          <Link to="/admin/dashboard" className="flex items-center gap-3 px-2">
            <img src="/logo_refresca.png" alt="Refresca Bebidas" className="h-10 w-auto object-contain rounded-lg" />
            <div>
              <span className="font-display font-black text-sm text-white tracking-wider block">REFRESCA</span>
              <span className="text-[10px] text-[#00E5FF] font-bold tracking-widest uppercase block">Painel Gerente</span>
            </div>
          </Link>

          {/* Botão Fixo de Instalar App no Desktop (oculto se já estiver no app instalado) */}
          {!isStandalone && (
            <div className="px-1">
              <button
                onClick={promptInstall}
                className="w-full bg-gradient-to-r from-[#00E5FF]/20 to-[#00B4D8]/10 hover:from-[#00E5FF]/30 hover:to-[#00B4D8]/20 border border-[#00E5FF]/40 hover:border-[#00E5FF] text-[#00E5FF] px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-500/10 active:scale-95 group cursor-pointer"
                title="Instalar aplicativo no computador"
              >
                <Download size={15} className="group-hover:translate-y-0.5 transition-transform shrink-0" />
                <span className="truncate">Instalar App no PC</span>
              </button>
            </div>
          )}

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
        <div className="pt-4 border-t border-white/10 space-y-2.5">
          {/* Card de Status da Impressora Térmica / Auto-Imprimir */}
          <div className="bg-[#0A0F1D] border border-white/10 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${autoPrintEnabled ? 'bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-gray-500'}`}></span>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-200 block truncate">
                  Auto-Imprimir
                </span>
                <span className="text-[9px] text-gray-400 block truncate">
                  {autoPrintEnabled ? 'Notinha Automática' : 'Desativado'}
                </span>
              </div>
            </div>
            <button
              onClick={toggleAutoPrint}
              className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                autoPrintEnabled
                  ? 'bg-[#10B981] hover:bg-[#059669] text-[#0A0F1D] shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-gray-300'
              }`}
              title={autoPrintEnabled ? 'Clique para pausar auto-impressão' : 'Clique para ativar auto-impressão'}
            >
              <Printer size={11} />
              {autoPrintEnabled ? 'Ativo' : 'Pausar'}
            </button>
          </div>

          {/* Card de Status do Som / Notificações */}
          <div className="bg-[#0A0F1D] border border-white/10 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${notificationPermission === 'granted' ? 'bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 truncate">
                {notificationPermission === 'granted' ? 'Som Ativo' : 'Som Pendente'}
              </span>
            </div>
            {notificationPermission === 'granted' ? (
              <button
                onClick={handleTestSound}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-[#00E5FF] hover:text-white px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                title="Tocar som de teste no notebook"
              >
                <Volume2 size={12} /> Testar
              </button>
            ) : (
              <button
                onClick={handleEnableNotifications}
                className="bg-amber-400 hover:bg-amber-300 text-[#0A0F1D] px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors shrink-0 cursor-pointer shadow-sm"
              >
                Ativar
              </button>
            )}
          </div>

          <Link
            to="/"
            target={isStandalone ? '_self' : '_blank'}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-[#00E5FF] px-3 py-2 transition-colors font-medium"
          >
            Ver Loja Pública ↗
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut size={16} /> Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Topbar Mobile (< 768px) */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-[#070B16]/95 backdrop-blur-md border-b border-white/10">
        <Link to="/admin/dashboard" className="flex items-center gap-2.5">
          <img src="/logo_refresca.png" alt="Refresca" className="h-9 w-auto object-contain rounded-md" />
          <div>
            <span className="font-display font-black text-xs sm:text-sm text-white block leading-none">REFRESCA ADMIN</span>
            <span className="text-[9px] text-[#00E5FF] font-bold uppercase tracking-widest">Gestão Express</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {/* Botão Compacto Auto-Print no Topbar Mobile */}
          <button
            onClick={toggleAutoPrint}
            className={`px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors ${
              autoPrintEnabled
                ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
            title={autoPrintEnabled ? 'Auto-Imprimir Ativado (clique para pausar)' : 'Auto-Imprimir Pausado (clique para ativar)'}
          >
            <Printer size={13} />
            <span className="hidden sm:inline">{autoPrintEnabled ? 'Auto-Print' : 'Pausado'}</span>
          </button>

          {!isStandalone && (
            <button
              onClick={promptInstall}
              className="px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 bg-[#00E5FF] text-[#0A0F1D] shadow-sm shadow-cyan-500/20 active:scale-95 transition-all"
              title="Instalar App no aparelho"
            >
              <Download size={13} />
              <span>Instalar</span>
            </button>
          )}
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

      {/* Menu Drawer Mobile */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[57px] z-40 bg-[#070B16] border-b border-white/10 p-4 space-y-1 shadow-2xl max-h-[calc(100vh-57px)] overflow-y-auto">
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
          {/* Auto-Imprimir no Mobile */}
          <div className="bg-[#0A0F1D] border border-white/10 rounded-xl p-3 flex items-center justify-between gap-2 mt-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${autoPrintEnabled ? 'bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-gray-500'}`}></span>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider">Auto-Imprimir Notinhas</p>
                <p className="text-[10px] text-gray-400">Imprime ao receber novo pedido</p>
              </div>
            </div>
            <button
              onClick={toggleAutoPrint}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                autoPrintEnabled
                  ? 'bg-[#10B981] text-[#0A0F1D]'
                  : 'bg-white/10 text-gray-300'
              }`}
            >
              <Printer size={13} />
              {autoPrintEnabled ? 'Ativo' : 'Pausar'}
            </button>
          </div>

          {!isStandalone && (
            <div className="pt-2">
              <button
                onClick={() => { setIsMobileMenuOpen(false); promptInstall(); }}
                className="w-full bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] text-[#0A0F1D] font-black uppercase text-xs tracking-wider py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-98"
              >
                <Download size={16} /> Instalar Aplicativo no Aparelho
              </button>
            </div>
          )}
          <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between">
            <Link
              to="/"
              target={isStandalone ? '_self' : '_blank'}
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2.5 text-xs font-bold text-[#00E5FF]"
            >
              Abrir Loja Pública ↗
            </Link>
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
      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-7 overflow-y-auto custom-scrollbar">
        {/* Banner de Ativação de Notificações e Som de Novos Pedidos */}
        {notificationPermission !== 'granted' && (
          <div className="mb-5 bg-gradient-to-r from-amber-500/15 via-[#101935] to-amber-500/10 border border-amber-500/40 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3.5 shadow-xl animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <BellRing className="animate-bounce" size={20} />
              </div>
              <div>
                <h4 className="text-white font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                  <span>Ativar Som & Alertas de Novos Pedidos</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">Importante</span>
                </h4>
                <p className="text-[11px] text-gray-300 leading-snug mt-0.5">
                  Permita as notificações para o seu notebook tocar a campainha e avisar no sistema sempre que chegar um pedido.
                </p>
              </div>
            </div>
            <button
              onClick={handleEnableNotifications}
              className="bg-amber-400 hover:bg-amber-300 text-[#0A0F1D] px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap shadow-lg shadow-amber-500/20 active:scale-95 transition-all shrink-0 cursor-pointer flex items-center gap-2"
            >
              <Bell size={14} /> Ativar Som no Notebook
            </button>
          </div>
        )}

        <Outlet />
      </main>

    </div>
  );
};

export default AdminLayout;
