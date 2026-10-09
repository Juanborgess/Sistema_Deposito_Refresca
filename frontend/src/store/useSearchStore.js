import { create } from 'zustand';

export const useSearchStore = create((set) => ({
  searchTerm: '',
  selectedCategory: 'todas',
  setSearchTerm: (term) => set({ searchTerm: term }),
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  clearSearch: () => set({ searchTerm: '' }),
}));
