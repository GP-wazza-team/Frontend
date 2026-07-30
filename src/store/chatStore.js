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
      // An index from a stale ref (e.g. the messages array was reloaded and
      // shrank underneath a card still tracked by index) must not silently
      // write past the end — spreading a sparse array later turns the gap
      // into real `undefined` elements, which crashes MessageBubble on
      // render with no error boundary to catch it.
      if (index < 0 || index >= state.messages.length) return state
      const newMessages = [...state.messages]
      newMessages[index] = message
      return { messages: newMessages }
    })
  },

  clear: () => set({ chats: [], currentChatId: null, messages: [] }),
}))
