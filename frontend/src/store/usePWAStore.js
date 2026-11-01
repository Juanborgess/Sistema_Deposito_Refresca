import { create } from 'zustand';

export const usePWAStore = create((set, get) => ({
  deferredPrompt: null,
  isStandalone: false,
  showHelpModal: false,

  setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt }),
  setIsStandalone: (val) => set({ isStandalone: val }),
  setShowHelpModal: (val) => set({ showHelpModal: val }),

  promptInstall: async () => {
    const { deferredPrompt } = get();
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          set({ deferredPrompt: null, showHelpModal: false });
        }
        return outcome;
      } catch (err) {
        console.warn('Erro ao acionar prompt PWA:', err);
        set({ showHelpModal: true });
      }
    } else {
      // Se não houver prompt nativo pronto em memória, abre o modal de orientação visual
      set({ showHelpModal: true });
    }
    return null;
  }
}));

