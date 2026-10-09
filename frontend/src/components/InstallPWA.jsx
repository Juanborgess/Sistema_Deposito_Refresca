import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);

  useEffect(() => {
    // Detecta se já está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    if (isStandalone) {
      return; // Já está no app, não faz nada
    }

    // Detecta iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // No iOS, não tem o evento, mostramos um aviso após 3 segundos
      const timer = setTimeout(() => {
        const hasDismissed = localStorage.getItem('pwa_ios_dismissed');
        if (!hasDismissed) setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // Para Android / Desktop (Chrome, Edge)
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSTip(true);
      return;
    }
    
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (isIOS) {
      localStorage.setItem('pwa_ios_dismissed', 'true');
    }
  };

  const location = useLocation();
  if (!location.pathname.startsWith('/admin')) return null;
  if (!isVisible) return null;

  return (
    <>
      {/* Banner Flutuante de Instalação */}
      <div className="fixed bottom-4 left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6 md:w-[340px]">
        <div className="bg-[#0A0F1D] border border-[#00E5FF]/30 p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#00E5FF]/10 rounded-xl flex items-center justify-center shrink-0 border border-[#00E5FF]/20">
              <img src="/logo_refresca.png" alt="App" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm tracking-wider uppercase">Painel Refresca</h4>
              <p className="text-[11px] text-gray-400 leading-tight">Instale o app para gerenciar pedidos!</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <button 
              onClick={handleInstallClick}
              className="bg-[#00E5FF] text-[#0A0F1D] text-[11px] font-black uppercase px-4 py-2 rounded-lg hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(0,229,255,0.3)]"
            >
              Baixar
            </button>
            <button 
              onClick={handleDismiss}
              className="text-gray-500 hover:text-white text-[10px] uppercase font-bold"
            >
              Agora Não
            </button>
          </div>
        </div>
      </div>

      {/* Dica de Instalação para iOS (Safari) */}
      {showIOSTip && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowIOSTip(false)}>
          <div className="bg-[#101935] border border-white/10 rounded-3xl p-6 w-full max-w-sm mb-4 relative shadow-2xl animate-in slide-in-from-bottom-10" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowIOSTip(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <X size={20} />
            </button>
            
            <h3 className="text-white font-black font-display text-xl mb-4 text-center">Instalar no iPhone</h3>
            
            <div className="space-y-4 text-sm text-gray-300">
              <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-[#00E5FF] text-[#0A0F1D] flex items-center justify-center font-bold text-xs shrink-0">1</span>
                <p>Toque no ícone <Share size={16} className="inline mx-1 text-[#00E5FF]" /> de <strong>Compartilhar</strong> na barra inferior do Safari.</p>
              </div>
              <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-[#00E5FF] text-[#0A0F1D] flex items-center justify-center font-bold text-xs shrink-0">2</span>
                <p>Role para baixo e selecione <PlusSquare size={16} className="inline mx-1 text-white" /> <strong>"Adicionar à Tela de Início"</strong>.</p>
              </div>
            </div>
            
            <button 
              onClick={() => { setShowIOSTip(false); handleDismiss(); }}
              className="w-full mt-6 bg-[#00E5FF] text-[#0A0F1D] py-3 rounded-xl font-bold uppercase text-xs tracking-wider"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallPWA;
