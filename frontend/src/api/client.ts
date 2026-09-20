import axios from 'axios'
import { useAuthStore } from '../store/authStore'

// Dev: relative URLs go through the Vite proxy to localhost:8000 (vite.config.ts).
// Prod: the deployed API, unless VITE_API_BASE_URL overrides it at build time.
const client = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ??
    (import.meta.env.DEV ? '' : 'https://vibelearning-api.ashyforest-5660fbcb.canadacentral.azurecontainerapps.io'),
})

// Inject Bearer token on every request
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401, log out and redirect to login
client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client

