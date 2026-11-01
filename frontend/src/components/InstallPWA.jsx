import React, { useEffect } from 'react';
import { Share, PlusSquare, X, Monitor, Smartphone, Download } from 'lucide-react';
import { usePWAStore } from '../store/usePWAStore';

const InstallPWA = () => {
  const { setDeferredPrompt, setIsStandalone, showHelpModal, setShowHelpModal, promptInstall } = usePWAStore();

  useEffect(() => {
    // Detecta se já está instalado (standalone)
    const checkStandalone = () => {
      const isApp = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
      setIsStandalone(isApp);
    };

    checkStandalone();

    // Captura evento de instalação do Chrome / Edge / Android
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const installedHandler = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      setShowHelpModal(false);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, [setDeferredPrompt, setIsStandalone, setShowHelpModal]);

  if (!showHelpModal) return null;

  const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setShowHelpModal(false)}
    >
      <div 
        className="bg-[#101935] border border-[#00E5FF]/40 rounded-3xl p-6 w-full max-w-md relative shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={() => setShowHelpModal(false)} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg bg-white/5 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 bg-[#00E5FF]/10 rounded-2xl flex items-center justify-center border border-[#00E5FF]/30 shrink-0">
            <img src="/logo_refresca.png" alt="Refresca Admin" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h3 className="text-white font-black font-display text-base uppercase tracking-wider">
              Instalar Refresca Admin
            </h3>
            <p className="text-xs text-[#00E5FF] font-medium">Aplicativo Gerente de Pedidos</p>
          </div>
        </div>

        {isIOS ? (
          <div className="space-y-3.5 text-sm text-gray-300">
            <p className="text-xs text-gray-400">Para instalar no seu iPhone ou iPad:</p>
            <div className="flex items-center gap-3.5 bg-white/5 p-3 rounded-2xl border border-white/5">
              <span className="w-6 h-6 rounded-full bg-[#00E5FF] text-[#0A0F1D] flex items-center justify-center font-bold text-xs shrink-0">1</span>
              <p className="text-xs">Toque no ícone <Share size={15} className="inline mx-1 text-[#00E5FF]" /> de <strong>Compartilhar</strong> na barra do Safari.</p>
            </div>
            <div className="flex items-center gap-3.5 bg-white/5 p-3 rounded-2xl border border-white/5">
              <span className="w-6 h-6 rounded-full bg-[#00E5FF] text-[#0A0F1D] flex items-center justify-center font-bold text-xs shrink-0">2</span>
              <p className="text-xs">Role para baixo e selecione <PlusSquare size={15} className="inline mx-1 text-white" /> <strong>"Adicionar à Tela de Início"</strong>.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 text-sm text-gray-300">
            <p className="text-xs text-gray-400">
              Instale o aplicativo diretamente no seu <strong>computador (Windows / Linux / Mac)</strong> ou celular Android:
            </p>

            <div className="flex items-start gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/5">
              <Monitor size={20} className="text-[#00E5FF] shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold text-white block">No Computador (Chrome / Edge):</span>
                <p className="text-gray-300">
                  Clique no ícone de <strong>instalar aplicativo</strong> (um pequeno computador com seta para baixo) na <strong>barra de endereços</strong> lá em cima à direita, ou clique no botão abaixo.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
              <Smartphone size={18} className="text-[#00E5FF] shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <span className="font-bold text-white block">No Celular (Android):</span>
                <p className="text-gray-300">
                  Toque nos 3 pontinhos <strong>(⋮)</strong> do navegador e escolha <strong>"Instalar aplicativo"</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => promptInstall()}
              className="w-full mt-2 bg-[#00E5FF] hover:bg-[#00B4D8] text-[#0A0F1D] py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
            >
              <Download size={16} /> Tentar Instalação Direta
            </button>
          </div>
        )}

        <button 
          onClick={() => setShowHelpModal(false)}
          className="w-full mt-3 bg-white/5 hover:bg-white/10 text-gray-300 py-2.5 rounded-xl font-bold uppercase text-xs tracking-wider transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};

export default InstallPWA;
