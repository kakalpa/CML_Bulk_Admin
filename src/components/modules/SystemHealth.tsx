import React, { useState, useEffect } from "react"
import { Activity, Cpu, HardDrive, MemoryStick, RefreshCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/auth"

export function SystemHealth() {
  const { status: authStatus } = useAuthStore()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchStats = async () => {
    if (authStatus !== 'connected') return
    setLoading(true)
    try {
      // CML system stats endpoint (fixed path)
      const res = await api.get('/system_stats')
      setStats(res.data)
    } catch (err) {
      console.error("Failed to fetch system stats", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [authStatus])

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
        <Activity className="h-12 w-12 text-muted animate-pulse" />
        <p className="text-muted-foreground italic">Fetching real-time system metrics...</p>
        <Button onClick={fetchStats} variant="outline" size="sm">Retry Connection</Button>
      </div>
    )
  }

  // CML /system_stats response mapping
  const allStats = stats.all || {}
  const cpuUsage = allStats.cpu?.percent || 0
  const cpuCount = allStats.cpu?.count || 0
  
  // Convert Bytes to MB
  const memUsed = (allStats.memory?.used || 0) / (1024 * 1024)
  const memTotal = (allStats.memory?.total || 1) / (1024 * 1024)
  const memUsage = (memUsed / memTotal) * 100

  const diskUsed = (allStats.disk?.used || 0) / (1024 * 1024)
  const diskTotal = (allStats.disk?.total || 1) / (1024 * 1024)
  const diskUsage = (diskUsed / diskTotal) * 100

  // Sum up node counts from all computes
  let runningNodes = 0
  let totalNodes = 0
  let allocatedCpus = 0
  let allocatedMem = 0

  if (stats.computes) {
    Object.values(stats.computes).forEach((c: any) => {
      const dom = c.stats?.dominfo
      if (dom) {
        runningNodes += dom.running_nodes || 0
        totalNodes += dom.total_nodes || 0
        allocatedCpus += dom.allocated_cpus || 0
        allocatedMem += (dom.allocated_memory || 0) / (1024 * 1024)
      }
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">System Health</h1>
        <p className="text-muted-foreground mt-1">Real-time performance metrics of the CML physical host.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Processor (vCPU)</CardTitle>
            <Cpu className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cpuUsage.toFixed(1)}%</div>
            <Progress value={cpuUsage} className="mt-3 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              System load across {cpuCount} cores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Memory (RAM)</CardTitle>
            <MemoryStick className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memUsage.toFixed(1)}%</div>
            <Progress value={memUsage} className="mt-3 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {memUsed.toFixed(0)} MB of {memTotal.toFixed(0)} MB used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Storage (Disk)</CardTitle>
            <HardDrive className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{diskUsage.toFixed(1)}%</div>
            <Progress value={diskUsage} className="mt-3 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {(diskTotal - diskUsed).toFixed(0)} MB available
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-3">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Resource Allocation</CardTitle>
              <CardDescription>Breakdown of compute resources across active simulations.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchStats} disabled={loading}>
              <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Active Nodes (Running)</span>
              <span className="font-bold">{runningNodes} / {totalNodes}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Allocated vCPUs</span>
              <span className="font-bold">{allocatedCpus} vCPUs</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Allocated RAM</span>
              <span className="font-bold">{allocatedMem.toFixed(0)} MB</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
