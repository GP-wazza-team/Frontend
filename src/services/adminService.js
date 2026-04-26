import api from './api'

export const adminService = {
  getRuns: async (page = 1, limit = 25, filters = {}) => {
    const params = { skip: (page - 1) * limit, limit, ...filters }
    const response = await api.get('/admin/runs', { params })
    return response.data
  },

  getRunDetail: async (runId) => {
    const response = await api.get(`/admin/runs/${runId}`)
    return response.data
  },

  getStats: async (days = 30) => {
    const response = await api.get('/admin/stats', { params: { days } })
    return response.data
  },

  getModelCostBreakdown: async (days = 30) => {
    const response = await api.get('/admin/model-costs', { params: { days } })
    return response.data
  },

  getProviderStats: async (days = 30) => {
    const response = await api.get('/admin/provider-stats', { params: { days } })
    return response.data
  },

  getDailyMetrics: async (days = 30) => {
    const response = await api.get('/admin/daily-metrics', { params: { days } })
    return response.data
  },

  exportRuns: async (filters = {}) => {
    const response = await api.get('/admin/runs/export', {
      params: filters,
      responseType: 'blob',
    })
    return response.data
  },

  deleteRun: async (runId) => {
    await api.delete(`/admin/runs/${runId}`)
  },
}
