import axios from 'axios'
import { useAuthStore } from '@/store/auth'
import { useLogsStore } from '@/store/logs'

// Create an Axios instance
// We use /api/v0 as the base URL which Vite will proxy to the actual CML host
export const api = axios.create({
  baseURL: '/api/v0',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request Interceptor: Attach Bearer Token & Log Request
api.interceptors.request.use((config) => {
  const state = useAuthStore.getState()
  
  // Attach token if available
  if (state.token) {
    config.headers.Authorization = `Bearer ${state.token}`
  }

  // Record request start time for logging
  ;(config as any).metadata = { startTime: new Date() }
  
  return config
}, (error) => {
  return Promise.reject(error)
})

// Response Interceptor: Handle 401s & Log Response
api.interceptors.response.use((response) => {
  const { config } = response
  const startTime = (config as any).metadata?.startTime
  const duration = startTime ? new Date().getTime() - startTime.getTime() : 0
  
  // Add to logs
  useLogsStore.getState().addLog({
    method: config.method?.toUpperCase() || 'UNKNOWN',
    url: config.url || '',
    status: response.status,
    duration
  })

  return response
}, (error) => {
  const { config, response } = error
  const startTime = config && (config as any).metadata?.startTime
  const duration = startTime ? new Date().getTime() - startTime.getTime() : 0
  
  if (config) {
    useLogsStore.getState().addLog({
      method: config.method?.toUpperCase() || 'UNKNOWN',
      url: config.url || '',
      status: response?.status,
      error: error.message,
      duration
    })
  }

  // Handle Unauthorized (token expired or invalid)
  if (response?.status === 401 || response?.status === 403) {
    // If not on the authenticate endpoint, disconnect
    if (!config.url?.includes('/authenticate')) {
      useAuthStore.getState().disconnect()
    }
  }

  return Promise.reject(error)
})
