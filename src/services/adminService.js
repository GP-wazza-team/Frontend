import api from './api'

export const adminService = {
  getOverview: async (days = 30) => {
    const response = await api.get('/admin/overview', { params: { days } })
    return response.data
  },

  getRuns: async (page = 1, limit = 25, filters = {}) => {
    const params = { skip: (page - 1) * limit, limit, ...filters }
    const response = await api.get('/admin/runs', { params })
    return response.data
  },

  // Hits five vendors server-side, so it is slower than the other admin calls
  // and is loaded separately from the overview rather than blocking it.
  getProviderBalances: async (days = 30, refresh = false) => {
    const response = await api.get('/admin/provider-balances', { params: { days, refresh } })
    return response.data
  },

  getRunDetail: async (runId) => {
    const response = await api.get(`/admin/runs/${runId}`)
    return response.data
  },

  deleteRun: async (runId) => {
    await api.delete(`/admin/runs/${runId}`)
  },

  exportRuns: async (filters = {}) => {
    const response = await api.get('/admin/runs/export', {
      params: filters,
      responseType: 'blob',
    })
    return response.data
  },
}
