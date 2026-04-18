import axios from 'axios'

// Use the same origin the user opened the app from.
// This works whether the app is on :3000, :80, or any other port.
// Override with VITE_API_BASE_URL only for local dev against a separate backend.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || window.location.origin

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 300000, // 5 minutes — generation pipeline can take a while
})

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
)

export default api
