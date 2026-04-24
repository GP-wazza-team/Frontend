import api from './api'

export const authService = {
  register: async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password })
    return data
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    return data
  },

  logout: async (refreshToken) => {
    await api.post('/auth/logout', { refresh_token: refreshToken })
  },

  refresh: async (refreshToken) => {
    const { data } = await api.post('/auth/refresh', { refresh_token: refreshToken })
    return data
  },

  me: async () => {
    const { data } = await api.get('/auth/me')
    return data
  },

  forgotPassword: async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email })
    return data
  },

  resetPassword: async (token, newPassword) => {
    const { data } = await api.post('/auth/reset-password', {
      token,
      new_password: newPassword,
    })
    return data
  },

  verifyEmail: async (token) => {
    const { data } = await api.post('/auth/verify-email', { token })
    return data
  },
}
