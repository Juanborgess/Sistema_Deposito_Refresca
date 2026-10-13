import { create } from 'zustand';

const getInitialTheme = () => {
  try {
    const saved = localStorage.getItem('refresca_theme');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch (e) {
    // ignore
  }
  return 'light'; // Padrão: Tema Claro Clean Ice
};

export const useThemeStore = create((set) => ({
  theme: getInitialTheme(),
  toggleTheme: () => set((state) => {
    const nextTheme = state.theme === 'light' ? 'dark' : 'light';
    try {
      localStorage.setItem('refresca_theme', nextTheme);
    } catch (e) {}
    return { theme: nextTheme };
  }),
  setTheme: (newTheme) => set(() => {
    try {
      localStorage.setItem('refresca_theme', newTheme);
    } catch (e) {}
    return { theme: newTheme };
  }),
}));

export default useThemeStore;
