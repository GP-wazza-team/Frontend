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
  // `sketchMode` says the attachment is a rough drawing, not a finished
  // picture. It changes what happens to the file: off, it becomes the video's
  // opening frame as-is; on, a vision model reads it and it is redrawn into a
  // finished still that gets animated instead. It must be passed to plan() as
  // well as start() — start() only creates the run row, and plan() is the call
  // that reads the sketch and picks the path.
  start: async (chatId, prompt, imageAttachmentUrl = null, sketchMode = false) => {
    const response = await api.post('/generate/start', {
      chat_id: chatId,
      prompt,
      image_attachment_path: imageAttachmentUrl || undefined,
      sketch_mode: sketchMode,
    })
    return response.data
  },

  // The models this deployment can actually run — a model whose provider has no
  // API key configured is deliberately absent, so render whatever comes back
  // rather than hard-coding the options.
  getModels: async () => {
    const response = await api.get('/generate/models')
    return response.data
  },

  // The unfinished run this chat should return to, or null. Called when a chat
  // is opened: the plan card, its previews, any pending questions and any media
  // already produced live only in this response, because the cards themselves
  // were never persisted anywhere.
  getActiveRun: async (chatId) => {
    const response = await api.get(`/generate/chats/${chatId}/active-run`)
    return response.data
  },

  // Change quality / aspect ratio / model on a run that is awaiting
  // confirmation. Free and instant: no LLM call, and the reviewed brief,
  // script and previews are left untouched. Returns the refreshed plan,
  // including any new warning about the combination chosen.
  updateSettings: async (runId, settings) => {
    const response = await api.post(`/generate/runs/${runId}/settings`, settings)
    return response.data
  },

  // Legacy one-shot path: plans and generates in a single blocking call.
  // Kept for callers that don't want the confirmation gate.
  execute: async (runId, imageAttachmentUrl = null, sketchMode = false) => {
    const response = await api.post(`/generate/runs/${runId}/execute`, {
      image_attachment_path: imageAttachmentUrl || undefined,
      sketch_mode: sketchMode,
    })
    return response.data
  },

  // ── Confirmation-gate flow ────────────────────────────────────────────────
  // plan() stops after the orchestrator + enhancer and returns a summary for
  // review. Nothing is generated until confirm(). It may instead return a
  // clarification payload (status 'awaiting_clarification') when the prompt is
  // too vague, so callers must branch on response.status.

  plan: async (runId, imageAttachmentUrl = null, sketchMode = false) => {
    const response = await api.post(`/generate/runs/${runId}/plan`, {
      image_attachment_path: imageAttachmentUrl || undefined,
      sketch_mode: sketchMode,
    })
    return response.data
  },

  // previewType: 'environment' | 'character'. characterName is required when
  // previewType is 'character' — pick one from the plan's character_names.
  // Charged like any image generation.
  preview: async (runId, previewType, characterName = null) => {
    const response = await api.post(`/generate/runs/${runId}/preview`, {
      preview_type: previewType,
      character_name: characterName || undefined,
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
  // pauseAfterScene is scene-by-scene mode: the server generates exactly one
  // more scene, writes it into the chat, and parks the run back at awaiting
  // confirmation — each further scene is another confirm() with the same flag.
  confirm: async (runId, { pauseAfterScene = false } = {}) => {
    const response = await api.post(`/generate/runs/${runId}/confirm`, {
      pause_after_scene: pauseAfterScene,
    })
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

  generate: async (chatId, prompt, imageAttachmentUrl = null, sketchMode = false) => {
    const response = await api.post('/generate/', {
      chat_id: chatId,
      prompt,
      image_attachment_path: imageAttachmentUrl || undefined,
      sketch_mode: sketchMode,
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
