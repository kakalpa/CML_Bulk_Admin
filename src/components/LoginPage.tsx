import React from "react"
import { useAuthStore } from "@/store/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

export function LoginPage() {
  const { host, username, password, status, error, setCredentials, connect } = useAuthStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    connect()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">CML Admin Login</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Login to access the bulk admin dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            // type="hidden"
            placeholder="CML Host (e.g. 192.168.0.100)"
            value={host}
            onChange={(e) => setCredentials({ host: e.target.value })}
            disabled={status === 'connecting'}
          />
          <Input
            placeholder="Username"
            value={username}
            onChange={(e) => setCredentials({ username: e.target.value })}
            disabled={status === 'connecting'}
          />
          <Input
            type="password"
            placeholder="Password / Token"
            value={password}
            onChange={(e) => setCredentials({ password: e.target.value })}
            disabled={status === 'connecting'}
          />

          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span className="font-semibold">Login failed:</span> {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={status === 'connecting'}>
            {status === 'connecting' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...
              </>
            ) : (
              'Connect'
            )}
          </Button>

          {status === 'connected' && (
            <div className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900">
              <CheckCircle2 className="inline mr-2 h-4 w-4" /> Connected
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
