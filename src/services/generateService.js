import api from './api'

export const generateService = {
  generate: async (chatId, prompt, imageAttachmentUrl = null) => {
    const response = await api.post('/generate', {
      chat_id: chatId,
      prompt,
      image_attachment_path: imageAttachmentUrl || undefined,
    })
    return response.data
  },

  getRun: async (runId) => {
    const response = await api.get(`/generate/runs/${runId}`)
    return response.data
  },

  getChatRuns: async (chatId) => {
    const response = await api.get(`/generate/chats/${chatId}/runs`)
    return response.data
  },

  connectWebSocket: (runId) => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
    const ws = new WebSocket(`${wsUrl}/api/generate/ws/${runId}`)
    return ws
  },
}
