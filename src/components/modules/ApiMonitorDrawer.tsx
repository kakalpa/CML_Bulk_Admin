import React, { useState } from "react"
import { Terminal, ChevronUp, ChevronDown, Trash2 } from "lucide-react"
import { useLogsStore } from "@/store/logs"
import { cn } from "@/lib/utils"

export function ApiMonitorDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const { logs, clearLogs } = useLogsStore()

  return (
    <div 
      className={cn(
        "absolute bottom-0 left-0 right-0 bg-card border-t shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out z-40 flex flex-col",
        isOpen ? "h-64" : "h-10"
      )}
    >
      <div 
        className="h-10 px-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 border-b select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2 text-sm font-medium">
          <Terminal className="h-4 w-4 text-primary" />
          <span>API Monitor & Logs</span>
          <span className="ml-2 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            {logs.length}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {isOpen && (
            <button 
              onClick={(e) => { e.stopPropagation(); clearLogs(); }}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center mr-4"
            >
              <Trash2 className="h-3 w-3 mr-1" /> Clear
            </button>
          )}
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto bg-black text-green-400 font-mono text-xs p-4">
        {logs.length === 0 ? (
          <div className="text-gray-500 italic">No API requests recorded yet...</div>
        ) : (
          <div className="space-y-1">
            {logs.map(log => (
              <div key={log.id} className="flex space-x-3 hover:bg-white/5 p-1 rounded">
                <span className="text-gray-500 shrink-0">
                  [{log.timestamp.toLocaleTimeString()}]
                </span>
                <span className={cn(
                  "font-bold shrink-0 w-12",
                  log.method === 'GET' ? 'text-blue-400' :
                  log.method === 'POST' ? 'text-green-400' :
                  log.method === 'PUT' ? 'text-yellow-400' :
                  log.method === 'DELETE' ? 'text-red-400' : 'text-gray-400'
                )}>
                  {log.method}
                </span>
                <span className="text-gray-300 flex-1 truncate">{log.url}</span>
                {log.status && (
                  <span className={cn(
                    "shrink-0 font-bold",
                    log.status >= 200 && log.status < 300 ? "text-green-500" : "text-red-500"
                  )}>
                    {log.status}
                  </span>
                )}
                {log.duration && (
                  <span className="text-gray-500 shrink-0 w-16 text-right">{log.duration}ms</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
