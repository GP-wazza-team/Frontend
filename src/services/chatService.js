import api from './api'

export const chatService = {
  // Backend returns a flat list: [{id, title, created_at, ...}]
  getChats: async () => {
    const response = await api.get('/chats/')
    return response.data // plain array
  },

  getChat: async (id) => {
    const response = await api.get(`/chats/${id}`)
    return response.data
  },

  createChat: async () => {
    const response = await api.post('/chats/', {})
    return response.data // single ChatOut object
  },

  renameChat: async (id, title) => {
    const response = await api.patch(`/chats/${id}`, { title })
    return response.data
  },

  deleteChat: async (id) => {
    await api.delete(`/chats/${id}`)
  },

  // Backend returns a flat list: [{id, chat_id, role, content, created_at}]
  getMessages: async (chatId) => {
    const response = await api.get(`/chats/${chatId}/messages`)
    return response.data // plain array
  },

  getWorldState: async (chatId) => {
    const response = await api.get(`/world-state/chats/${chatId}`)
    return response.data
  },
}
