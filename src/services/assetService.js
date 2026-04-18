import api from './api'

export const assetService = {
  // Backend returns: { total, skip, limit, items: [...] }
  // Uses skip (not page), and type filter is 'asset_type' param
  getAssets: async (page = 1, limit = 20, filters = {}) => {
    const skip = (page - 1) * limit
    const params = { skip, limit }
    if (filters.type) params.asset_type = filters.type
    if (filters.chat_id) params.chat_id = filters.chat_id

    const response = await api.get('/assets', { params })
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

  uploadImage: async (file, chatId) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post(`/assets/upload?chat_id=${chatId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    })
    return response.data.url
  },
}
