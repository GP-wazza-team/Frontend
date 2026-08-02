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
      // shrank underneath a card still tracked by index) must not write past
      // the end — spreading a sparse array later turns the gap into real
      // `undefined` elements, which crashes MessageBubble on render.
      //
      // Appending rather than bailing out keeps the card visible: dropping it
      // would lose a plan or clarification the user is waiting to answer.
      // `index === state.messages.length` needs no special case — the write
      // below already appends in that position.
      if (index < 0 || index > state.messages.length) {
        return { messages: [...state.messages, message] }
      }
      const newMessages = [...state.messages]
      newMessages[index] = message
      return { messages: newMessages }
    })
  },

  clear: () => set({ chats: [], currentChatId: null, messages: [] }),
}))
