import api from './api'

function getWsUrl() {
  // Explicit WS URL takes precedence
  const explicit = import.meta.env.VITE_WS_URL
  if (explicit) return explicit

  // Derive from API base URL
  const apiBase = import.meta.env.VITE_API_BASE_URL
  if (apiBase) {
    return apiBase
      .replace(/^http:/, 'ws:')
      .replace(/^https:/, 'wss:')
  }

  // Same-origin fallback
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}`
}

export const generateService = {
  generate: async (chatId, prompt, imageAttachmentUrl = null) => {
    const response = await api.post('/generate/', {
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
    const wsUrl = getWsUrl()
    const ws = new WebSocket(`${wsUrl}/api/generate/ws/${runId}`)
    return ws
  },
}
