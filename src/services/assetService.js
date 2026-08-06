import api from './api'

/* The filename the backend chose, off Content-Disposition. Readable only
   because the API exposes that header to cross-origin JS; if that is ever
   dropped this returns null and the caller's fallback name is used. */
function filenameFromHeaders(headers) {
  const disposition = headers?.['content-disposition'] || headers?.['Content-Disposition']
  if (!disposition) return null
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)
  return match ? decodeURIComponent(match[1]) : null
}

/* Hand the blob to the browser as a save. The object URL is revoked on the
   next tick rather than immediately — Safari has not started reading it when
   click() returns, and revoking too early gives an empty file. */
function saveBlob(blob, filename) {
  const href = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(href), 1000)
}

export const assetService = {
  // Backend returns: { total, skip, limit, items: [...] }
  // Uses skip (not page), and type filter is 'asset_type' param
  getAssets: async (page = 1, limit = 20, filters = {}) => {
    const skip = (page - 1) * limit
    const params = { skip, limit }
    if (filters.type) params.asset_type = filters.type
    if (filters.chat_id) params.chat_id = filters.chat_id

    const response = await api.get('/assets/', { params })
    const data = response.data
    return {
      assets: data.items || [],
      has_more: data.skip + data.limit < data.total,
      total: data.total,
    }
  },

  getAsset: async (id) => {
    const response = await api.get(`/assets/${id}`)
    return response.data
  },

  deleteAsset: async (id) => {
    await api.delete(`/assets/${id}`)
  },

  /*
    Save an image or video to the user's device.

    It has to go through the API rather than link straight at the URL we are
    displaying. Two reasons: the media lives on S3, and a browser ignores the
    `download` attribute on a cross-origin link — the clip opens in a tab
    instead of saving — and the API is behind a bearer token, which a plain
    <a href> cannot carry. Fetching through `api` gets both the header and the
    401-refresh that every other call already gets.

    Pass `id` where it is known (the asset library). The transcript replays
    media from a message's attachment list, which holds URLs and no ids, so
    there it falls back to `url` and the backend resolves it to the caller's
    own asset.
  */
  downloadMedia: async ({ id, url, fallbackName = 'wazza-download' } = {}) => {
    const response = id
      ? await api.get(`/assets/${id}/download`, { responseType: 'blob' })
      : await api.get('/assets/download', { params: { url }, responseType: 'blob' })

    saveBlob(response.data, filenameFromHeaders(response.headers) || fallbackName)
  },

  // `isSketch` marks the upload as a rough drawing rather than a finished
  // picture. It is recorded on the asset for the library's benefit; what
  // actually drives the pipeline is the same flag sent to /generate, so both
  // must be passed for one send.
  uploadImage: async (file, chatId, isSketch = false) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post(
      `/assets/upload?chat_id=${chatId}&is_sketch=${isSketch ? 'true' : 'false'}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      },
    )
    return response.data.url
  },
}
