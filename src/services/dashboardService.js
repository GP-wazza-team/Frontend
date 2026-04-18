import api from './api'

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats')
    return response.data
  },

  getCostHistory: async (days = 30) => {
    const response = await api.get('/dashboard/cost-history', {
      params: { days },
    })
    return response.data
  },

  getProviderUsage: async () => {
    const response = await api.get('/dashboard/provider-usage')
    return response.data
  },

  getRecentRuns: async (limit = 10) => {
    const response = await api.get('/dashboard/recent-runs', {
      params: { limit },
    })
    return response.data
  },

  checkHealth: async () => {
    const response = await api.get('/health')
    return response.data
  },
}
