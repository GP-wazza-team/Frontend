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
  start: async (chatId, prompt, imageAttachmentUrl = null) => {
    const response = await api.post('/generate/start', {
      chat_id: chatId,
      prompt,
      image_attachment_path: imageAttachmentUrl || undefined,
    })
    return response.data
  },

  // Legacy one-shot path: plans and generates in a single blocking call.
  // Kept for callers that don't want the confirmation gate.
  execute: async (runId, imageAttachmentUrl = null) => {
    const response = await api.post(`/generate/runs/${runId}/execute`, {
      image_attachment_path: imageAttachmentUrl || undefined,
    })
    return response.data
  },

  // ── Confirmation-gate flow ────────────────────────────────────────────────
  // plan() stops after the orchestrator + enhancer and returns a summary for
  // review. Nothing is generated until confirm(). It may instead return a
  // clarification payload (status 'awaiting_clarification') when the prompt is
  // too vague, so callers must branch on response.status.

  plan: async (runId, imageAttachmentUrl = null) => {
    const response = await api.post(`/generate/runs/${runId}/plan`, {
      image_attachment_path: imageAttachmentUrl || undefined,
    })
    return response.data
  },

  // previewType: 'environment' | 'character'. Charged like any image generation.
  preview: async (runId, previewType) => {
    const response = await api.post(`/generate/runs/${runId}/preview`, {
      preview_type: previewType,
    })
    return response.data
  },

  // field: 'brief_summary' | 'characters' | 'environment' | 'scenario'.
  // Free — overwrites the field directly with no LLM call.
  edit: async (runId, field, text) => {
    const response = await api.post(`/generate/runs/${runId}/edit`, { field, text })
    return response.data
  },

  // Overwrite the scene list of a multi-scene story. Free, no LLM call.
  editScript: async (runId, scenes) => {
    const response = await api.post(`/generate/runs/${runId}/edit-script`, { scenes })
    return response.data
  },

  // answers: [{ key, answer }]
  clarify: async (runId, answers) => {
    const response = await api.post(`/generate/runs/${runId}/clarify`, { answers })
    return response.data
  },

  // Re-plan from feedback instead of cancelling. May return a clarification payload.
  revise: async (runId, feedback) => {
    const response = await api.post(`/generate/runs/${runId}/revise`, { feedback })
    return response.data
  },

  // Grant permission — this is the call that actually spends money.
  confirm: async (runId) => {
    const response = await api.post(`/generate/runs/${runId}/confirm`)
    return response.data
  },

  // Resume a failed run from its approved plan. Nothing is re-planned and
  // scenes that already finished are not regenerated.
  retry: async (runId) => {
    const response = await api.post(`/generate/runs/${runId}/retry`)
    return response.data
  },

  cancel: async (runId) => {
    const response = await api.post(`/generate/runs/${runId}/cancel`)
    return response.data
  },

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
