import api from './api'

const VIDEO_EXTS = /\.(mp4|mov|webm|avi)(\?|$)/i

const toMediaItem = (url) => ({
  type: VIDEO_EXTS.test(url) || url.includes('/video/') ? 'video' : 'image',
  url,
})

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

  // Backend returns a flat list:
  // [{id, chat_id, role, content, attachments, created_at}]
  getMessages: async (chatId) => {
    const response = await api.get(`/chats/${chatId}/messages`)
    const messages = Array.isArray(response.data) ? response.data : []
    return messages.map((message) => {
      // A message body only ever names the final scene's URL, so the rest of a
      // multi-scene run is replayed from attachments. Anything already in the
      // text is skipped — the bubble renders those itself and would double up.
      const extra = (message.attachments || []).filter(
        (url) => !(message.content || '').includes(url)
      )
      return { ...message, media: extra.map(toMediaItem) }
    })
  },

  getWorldState: async (chatId) => {
    const response = await api.get(`/chats/${chatId}/world-state`)
    return response.data
  },
}
