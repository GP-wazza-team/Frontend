import { create } from 'zustand'

export const useToastStore = create((set, get) => ({
  toasts: [],

  addToast: (message, type = 'info') => {
    const id = Date.now() + Math.random()
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }))
    setTimeout(() => {
      get().removeToast(id)
    }, 3500)
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },

  clear: () => set({ toasts: [] }),
}))
