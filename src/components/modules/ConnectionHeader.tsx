import React from "react"
import { useAuthStore } from "@/store/auth"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

export function ConnectionHeader() {
  const { host, username, password, status, version, license, setCredentials, connect, disconnect } = useAuthStore()

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault()
    if (status === 'connected') {
      disconnect()
    } else {
      connect()
    }
  }

  return (
    <form onSubmit={handleConnect} className="flex items-center space-x-4 w-full">
      <div className="flex-1 flex space-x-2">
        <Input 
          placeholder="CML Host (e.g. 192.168.0.100)" 
          value={host}
          onChange={(e) => setCredentials({ host: e.target.value })}
          disabled={status === 'connected' || status === 'connecting'}
          className="max-w-[250px]"
        />
        <Input 
          placeholder="Username" 
          value={username}
          onChange={(e) => setCredentials({ username: e.target.value })}
          disabled={status === 'connected' || status === 'connecting'}
          className="max-w-[150px]"
        />
        <Input 
          type="password"
          placeholder="Password / Token" 
          value={password}
          onChange={(e) => setCredentials({ password: e.target.value })}
          disabled={status === 'connected' || status === 'connecting'}
          className="max-w-[150px]"
        />
        <Button 
          type="submit"
          variant={status === 'connected' ? 'secondary' : 'default'}
          disabled={status === 'connecting'}
        >
          {status === 'connecting' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {status === 'connected' ? 'Disconnect' : 'Connect'}
        </Button>
      </div>

      <div className="flex items-center space-x-4 px-4 py-2 bg-muted/50 rounded-lg border text-sm">
        <div className="flex items-center space-x-2">
          <span className="text-muted-foreground font-medium">Status:</span>
          {status === 'connected' ? (
            <span className="flex items-center text-status-success font-semibold">
              <CheckCircle2 className="mr-1 h-4 w-4" /> Connected
            </span>
          ) : status === 'error' ? (
            <span className="flex items-center text-status-error font-semibold">
              <XCircle className="mr-1 h-4 w-4" /> Error
            </span>
          ) : status === 'connecting' ? (
            <span className="flex items-center text-status-alert font-semibold">
              <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Connecting
            </span>
          ) : (
            <span className="text-muted-foreground">Offline</span>
          )}
        </div>
        
        {status === 'connected' && (
          <>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground font-medium">Version:</span>
              <span className="font-mono">{version}</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground font-medium">License:</span>
              <span className="text-status-success">{license}</span>
            </div>
          </>
        )}
      </div>
    </form>
  )
}
