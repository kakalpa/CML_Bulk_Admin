import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api'

const SESSION_TIMEOUT_MS = 30 * 60 * 1000

export interface CMLAuth {
  host: string
  username: string
  password: string // In a real app this should be handled securely, but for this local tool it's kept in memory
  token?: string
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  error?: string
  version?: string
  license?: string
  lastActivity?: number
}

interface AuthState extends CMLAuth {
  setCredentials: (creds: Partial<CMLAuth>) => void
  connect: () => Promise<void>
  touchSession: () => void
  checkSession: () => void
  disconnect: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      host: '172.16.50.128',
      username: 'admin',
      password: 'password',
      token: undefined,
      status: 'disconnected',
      lastActivity: undefined,
      
      setCredentials: (creds) => set((state) => ({ ...state, ...creds })),
      
      connect: async () => {
        let { host, username, password } = get()
        
        // Clean credentials (trim spaces and quotes)
        const clean = (s: string) => s.trim().replace(/^["']|["']$/g, '')
        host = clean(host)
        username = clean(username)
        password = clean(password)
        
        if (!host || (!username && !password)) return
        
        set({ status: 'connecting', error: undefined })
        
        try {
          // Send authentication request
          console.log(`Attempting auth to ${host} for user ${username}`)
          const authRes = await api.post('/authenticate', { username, password })
          
          // CML can return token as raw string or in an object
          const token = typeof authRes.data === 'string' ? authRes.data : authRes.data.token
          
          if (!token) {
            throw new Error("No token received from controller")
          }
          
          // Set token locally so the interceptor can use it for the next request
          set({ token })

          // Fetch system info
          let version = 'Unknown'
          let license = 'Unknown'
          try {
            const [sysRes, licRes] = await Promise.all([
              api.get('/system_information'),
              api.get('/licensing')
            ])
            version = sysRes.data.version || 'Unknown'
            
            // Map licensing status
            const regStatus = licRes.data.registration?.status || 'Unregistered'
            const authStatus = licRes.data.authorization?.status || 'No Auth'
            
            // Clean up strings (e.g., EVAL_MODE -> Evaluation)
            const format = (s: string) => s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
            
            if (authStatus.includes('EVAL') || authStatus.includes('AUTHORIZED')) {
              license = format(authStatus)
            } else {
              license = format(regStatus)
            }
          } catch (e) {
            console.warn("Could not fetch system or license info", e)
          }

          set({ 
            status: 'connected', 
            version,
            license,
            lastActivity: Date.now()
          })
        } catch (err: any) {
          console.error("Auth failed:", err.response?.data || err.message)
          set({ 
            status: 'error', 
            error: err.response?.data?.description || err.response?.data || err.message || 'Failed to connect',
            token: undefined
          })
        }
      },
      
      touchSession: () => set({ lastActivity: Date.now() }),

      checkSession: () => {
        const { lastActivity, status } = get()
        if (status !== 'connected' || !lastActivity) return
        if (Date.now() - lastActivity >= SESSION_TIMEOUT_MS) {
          set({ status: 'disconnected', version: undefined, license: undefined, password: '', token: undefined, lastActivity: undefined })
        }
      },

      disconnect: () => {
        set({ status: 'disconnected', version: undefined, license: undefined, password: '', token: undefined, lastActivity: undefined })
      }
    }),
    {
      name: 'cml-auth-storage',
      partialize: (state) => ({
        host: state.host,
        username: state.username,
        token: state.token,
        status: state.status,
        version: state.version,
        license: state.license,
        lastActivity: state.lastActivity
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        if (state.lastActivity && Date.now() - state.lastActivity >= SESSION_TIMEOUT_MS) {
          useAuthStore.getState().disconnect()
        }
      }
    }
  )
)
