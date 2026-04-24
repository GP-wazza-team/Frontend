import api from './api'

export const paymentService = {
  getPacks: async () => {
    const { data } = await api.get('/payments/packs')
    return data
  },

  createCheckout: async (packId, successUrl, cancelUrl) => {
    const { data } = await api.post('/payments/checkout', null, {
      params: { pack_id: packId, success_url: successUrl, cancel_url: cancelUrl },
    })
    return data // { checkout_url }
  },

  getCredits: async () => {
    const { data } = await api.get('/users/me/credits')
    return data // { credits }
  },

  getCreditHistory: async (limit = 50) => {
    const { data } = await api.get('/users/me/credits/history', { params: { limit } })
    return data
  },
}
