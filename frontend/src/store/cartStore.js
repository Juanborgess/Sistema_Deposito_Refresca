import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  items: [],
  isOpen: false,
  
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  
  addItem: (product, variations = [], quantity = 1, observation = '') => set((state) => {
    // ID único baseado no produto e variações escolhidas
    const variationsKey = JSON.stringify(variations) + observation;
    const cartItemId = `${product.id}_${btoa(encodeURIComponent(variationsKey)).slice(0, 15)}`;

    const existingItemIndex = state.items.findIndex(item => item.cartItemId === cartItemId);

    if (existingItemIndex >= 0) {
      const updatedItems = [...state.items];
      updatedItems[existingItemIndex].quantity += quantity;
      return { items: updatedItems, isOpen: true };
    } else {
      const newItem = {
        ...product,
        cartItemId,
        variacoes_selecionadas: variations,
        observacao: observation,
        quantity
      };
      return { items: [...state.items, newItem], isOpen: true };
    }
  }),
  
  removeItem: (cartItemId) => set((state) => ({
    items: state.items.filter(item => item.cartItemId !== cartItemId)
  })),
  
  updateQuantity: (cartItemId, change) => set((state) => ({
    items: state.items.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQuantity = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    })
  })),

  clearCart: () => set({ items: [] }),

  getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
  getSubtotal: () => get().items.reduce((total, item) => total + ((item.valor_final || item.valor) * item.quantity), 0),
}));

export default useCartStore;
