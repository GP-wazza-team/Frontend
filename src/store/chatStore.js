import { create } from 'zustand'

export const useChatStore = create((set, get) => ({
  chats: [],
  currentChatId: null,
  messages: [],
  loading: false,
  error: null,

  setChats: (chats) => set({ chats }),
  setCurrentChatId: (id) => set({ currentChatId: id }),
  setMessages: (messages) => set({ messages }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  addChat: (chat) => {
    set((state) => ({
      chats: [chat, ...state.chats],
    }))
  },

  removeChat: (id) => {
    set((state) => ({
      chats: state.chats.filter((c) => c.id !== id),
      currentChatId: state.currentChatId === id ? null : state.currentChatId,
    }))
  },

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }))
  },

  updateMessage: (index, message) => {
    set((state) => {
      const newMessages = [...state.messages]
      newMessages[index] = message
      return { messages: newMessages }
    })
  },

  clear: () => set({ chats: [], currentChatId: null, messages: [] }),
}))
