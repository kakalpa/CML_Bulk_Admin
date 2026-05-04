import { create } from 'zustand'

export interface LogEntry {
  id: string
  timestamp: Date
  method: string
  url: string
  status?: number
  error?: string
  duration?: number
}

interface LogsState {
  logs: LogEntry[]
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void
  clearLogs: () => void
}

export const useLogsStore = create<LogsState>((set) => ({
  logs: [],
  addLog: (log) => set((state) => ({
    logs: [{
      ...log,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date()
    }, ...state.logs].slice(0, 100) // keep last 100
  })),
  clearLogs: () => set({ logs: [] })
}))
