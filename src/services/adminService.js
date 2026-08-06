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

  // Which model each pipeline stage runs on, plus EVERY model in the registry
  // for each stage — including the ones that cannot be selected, each carrying
  // the reason. See app/core/runtime_config.py.
  getConfig: async () => {
    const response = await api.get('/admin/config')
    return response.data
  },

  // One stage per call. The provider is derived server-side from the registry
  // and must not be sent — a provider and model id that disagree is a mid-run
  // 404. Returns the full refreshed config alongside the applied value.
  setModelDefault: async (key, model) => {
    const response = await api.put('/admin/config', { key, model })
    return response.data
  },

  resetModelDefault: async (key) => {
    const response = await api.delete(`/admin/config/${key}`)
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

  // Server-side pagination and filtering — unlike the runs table, the user
  // list is not preloaded by the overview, so skip/limit/search/role go over
  // the wire. Empty filters are omitted rather than sent as empty strings.
  getUsers: async ({ skip = 0, limit = 25, search, role } = {}) => {
    const params = { skip, limit }
    if (search) params.search = search
    if (role) params.role = role
    const response = await api.get('/admin/users', { params })
    return response.data
  },

  // List-item fields plus credit_history (max 50) and recent_runs (max 10).
  getUserDetail: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`)
    return response.data
  },

  // Partial update: { role } and/or { is_active }. Returns the updated
  // list-item shape, so callers can replace the row without a refetch.
  updateUser: async (userId, changes) => {
    const response = await api.patch(`/admin/users/${userId}`, changes)
    return response.data
  },

  // amount: positive grant / negative deduction, never 0. reason is required —
  // the server stores it on the ledger row with the acting admin's email.
  // Returns { user_id, credits, transaction_id } with the NEW balance.
  adjustCredits: async (userId, { amount, reason }) => {
    const response = await api.post(`/admin/users/${userId}/credits`, { amount, reason })
    return response.data
  },

  // since_id returns only rows NEWER than that id (newest first) and makes the
  // server ignore skip — it exists for the live feed's 5s poll, so the poll
  // moves a cursor instead of re-reading the page it already has.
  getActivity: async ({ skip = 0, limit = 50, kind, search, since_id } = {}) => {
    const params = { skip, limit }
    if (kind) params.kind = kind
    if (search) params.search = search
    if (since_id) params.since_id = since_id
    const response = await api.get('/admin/activity', { params })
    return response.data
  },
}
