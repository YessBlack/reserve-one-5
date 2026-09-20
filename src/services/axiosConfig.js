import axios from 'https://cdn.jsdelivr.net/npm/axios@1.7.2/+esm'

const LOCALHOST_HOSTNAMES = ['localhost', '127.0.0.1']
const isLocalhost = LOCALHOST_HOSTNAMES.includes(window.location.hostname)

const API_URL = isLocalhost
  ? 'http://localhost:8080/api'
  : 'https://reserve-one-backend.onrender.com/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lanhua_token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default api

