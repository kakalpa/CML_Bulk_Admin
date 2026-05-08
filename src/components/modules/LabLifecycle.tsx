import React, { useState, useEffect } from "react"
import { Play, Square, RefreshCcw, Download, ShieldAlert, Cpu, MemoryStick, AlertTriangle, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/store/auth"
import { api } from "@/lib/api"

interface Lab {
  id: string
  title: string
  owner: string
  state: "STARTED" | "STOPPED" | "WIPED" | "BOOTING"
  nodes: number
  cpu_req: number
  ram_req: number // in MB
}

export function LabLifecycle() {
  const [labs, setLabs] = useState<Lab[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filterOwner, setFilterOwner] = useState("")
  const [resourceGuardOpen, setResourceGuardOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const { status: authStatus } = useAuthStore()
  
  const filteredLabs = labs.filter(l => l.owner.toLowerCase().includes(filterOwner.toLowerCase()))

  const toggleSelectAll = () => {
    if (selected.size === filteredLabs.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filteredLabs.map(l => l.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const calculateImpact = () => {
    const selectedLabs = labs.filter(l => selected.has(l.id) && l.state !== 'STARTED')
    const totalCpu = selectedLabs.reduce((sum, l) => sum + l.cpu_req, 0)
    const totalRam = selectedLabs.reduce((sum, l) => sum + l.ram_req, 0)
    return { count: selectedLabs.length, cpu: totalCpu, ram: totalRam / 1024 }
  }

  const handleFetchLabs = async () => {
    setIsProcessing(true)
    try {
      const res = await api.get('/labs?show_all=true')
      const ids = res.data as string[]
      
      const labDetails = await Promise.all(ids.map(async (id) => {
        try {
          const detailRes = await api.get(`/labs/${id}`)
          const nodeRes = await api.get(`/labs/${id}/nodes?data=true`)
          
          const nodes = nodeRes.data as any[]
          const cpu = nodes.reduce((sum, n) => sum + (n.cpus || 0), 0)
          const ram = nodes.reduce((sum, n) => sum + (n.ram || 0), 0)
          
          return {
            id: detailRes.data.id,
            title: detailRes.data.lab_title,
            owner: detailRes.data.owner_username,
            state: detailRes.data.state,
            nodes: detailRes.data.node_count,
            cpu_req: cpu,
            ram_req: ram
          }
        } catch (e) {
          console.error(`Failed to fetch details for lab ${id}`, e)
          return null
        }
      }))
      
      setLabs(labDetails.filter(l => l !== null) as Lab[])
    } catch (err) {
      console.error("Failed to fetch labs", err)
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    if (authStatus === 'connected') {
      handleFetchLabs()
    }
  }, [authStatus])

  const handleBulkStart = () => {
    setResourceGuardOpen(true)
  }

  const executeStart = async () => {
    setResourceGuardOpen(false)
    setIsProcessing(true)
    for (const id of selected) {
      try {
        await api.put(`/labs/${id}/start`)
      } catch (err) {
        console.error(`Failed to start lab ${id}`, err)
      }
    }
    await handleFetchLabs()
    setIsProcessing(false)
    setSelected(new Set())
  }

  const handleBulkStop = async () => {
    setIsProcessing(true)
    for (const id of selected) {
      try {
        await api.put(`/labs/${id}/stop`)
      } catch (err) {
        console.error(`Failed to stop lab ${id}`, err)
      }
    }
    await handleFetchLabs()
    setIsProcessing(false)
  }

  const handleBulkWipe = async () => {
    setIsProcessing(true)
    let skippedCount = 0;
    
    for (const id of selected) {
      const labInfo = labs.find(l => l.id === id);
      if (labInfo && labInfo.state !== 'STOPPED') {
        skippedCount++;
        continue;
      }
      
      try {
        await api.put(`/labs/${id}/wipe`)
      } catch (err) {
        console.error(`Failed to wipe lab ${id}`, err)
      }
    }
    await handleFetchLabs()
    setIsProcessing(false)
    
    if (skippedCount > 0) {
      alert(`Successfully wiped eligible labs. Skipped ${skippedCount} lab(s) because they must be STOPPED before wiping.`);
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE ${selected.size} labs? This cannot be undone.`)) return
    
    setIsProcessing(true)
    for (const id of selected) {
      try {
        await api.delete(`/labs/${id}`)
      } catch (err) {
        console.error(`Failed to delete lab ${id}`, err)
      }
    }
    await handleFetchLabs()
    setIsProcessing(false)
    setSelected(new Set())
  }

  const handleExportDefs = async () => {
    const targetLabs = selected.size > 0 ? filteredLabs.filter(l => selected.has(l.id)) : filteredLabs;
    if (targetLabs.length === 0) return;
    
    if (!confirm(`Download ${targetLabs.length} lab definition(s)?`)) return;

    setIsProcessing(true);
    for (const lab of targetLabs) {
      try {
        const res = await api.get(`/labs/${lab.id}/download`, { responseType: 'text' });
        
        // Create a blob and trigger download
        const blob = new Blob([res.data], { type: 'text/yaml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${lab.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_def.yaml`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Slight delay to prevent browser from blocking multiple rapid downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`Failed to download lab ${lab.id}`, err);
      }
    }
    setIsProcessing(false);
  }

  const impact = calculateImpact()

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Lab Lifecycle</h1>
          <p className="text-muted-foreground mt-1">Manage state and resources for student topologies.</p>
        </div>
      </div>

      {authStatus !== 'connected' && (
        <div className="bg-status-alert/10 border border-status-alert/20 text-status-alert p-4 rounded-lg flex items-center space-x-3">
          <ShieldAlert className="h-5 w-5" />
          <p className="text-sm font-medium">Please connect to a CML Controller in the header to enable API actions.</p>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div className="flex space-x-4 items-center">
            <Input 
              placeholder="Filter by owner..." 
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              className="w-64"
            />
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleFetchLabs} disabled={authStatus !== 'connected' || isProcessing}>
              <RefreshCcw className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`}/> 
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportDefs} disabled={authStatus !== 'connected' || isProcessing}><Download className="h-4 w-4 mr-2"/> Export Defs</Button>
          </div>
        </CardHeader>
        
        {selected.size > 0 && (
          <div className="bg-primary/5 border-b p-3 flex items-center justify-between px-6 animate-in slide-in-from-top-2">
            <span className="text-sm font-medium">{selected.size} labs selected</span>
            <div className="flex space-x-2">
              <Button size="sm" onClick={handleBulkStart} disabled={authStatus !== 'connected'} className="bg-status-success hover:bg-status-success/90">
                <Play className="h-4 w-4 mr-2" />
                Start Selected
              </Button>
              <Button size="sm" variant="secondary" onClick={handleBulkStop} disabled={authStatus !== 'connected' || isProcessing}>
                <Square className="h-4 w-4 mr-2" />
                Stop Selected
              </Button>
              <Button size="sm" variant="destructive" onClick={handleBulkWipe} disabled={authStatus !== 'connected' || isProcessing}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Wipe Selected
              </Button>
              <Button size="sm" variant="destructive" onClick={handleBulkDelete} disabled={authStatus !== 'connected' || isProcessing} className="bg-red-700 hover:bg-red-800">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          </div>
        )}

        <div className="max-h-[600px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
              <TableRow>
                <TableHead className="w-[50px]">
                  <input 
                    type="checkbox" 
                    className="rounded border-input text-primary focus:ring-primary"
                    checked={selected.size === filteredLabs.length && filteredLabs.length > 0}
                    onChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Lab Title</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="text-right">Nodes</TableHead>
                <TableHead className="text-right">vCPU</TableHead>
                <TableHead className="text-right">RAM (MB)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLabs.map((l) => (
                <TableRow key={l.id} data-state={selected.has(l.id) ? 'selected' : undefined}>
                  <TableCell>
                    <input 
                      type="checkbox" 
                      className="rounded border-input text-primary focus:ring-primary"
                      checked={selected.has(l.id)}
                      onChange={() => toggleSelect(l.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{l.title}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "px-2 py-1 rounded-md text-xs font-medium",
                      l.owner.includes('orphan') ? "bg-status-alert/10 text-status-alert border border-status-alert/20" : ""
                    )}>
                      {l.owner}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        l.state === 'STARTED' ? "bg-status-success" :
                        l.state === 'STOPPED' ? "bg-muted-foreground" :
                        l.state === 'WIPED' ? "bg-border" : "bg-status-alert animate-pulse"
                      )} />
                      <span className="text-sm">{l.state}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{l.nodes}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{l.cpu_req}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{l.ram_req}</TableCell>
                </TableRow>
              ))}
              {filteredLabs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No labs found matching the criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Resource Guard Modal */}
      <Modal 
        isOpen={resourceGuardOpen} 
        onClose={() => setResourceGuardOpen(false)}
        title="Resource Impact Warning"
        description="Starting multiple labs simultaneously can impact controller stability."
        footer={
          <>
            <Button variant="outline" onClick={() => setResourceGuardOpen(false)}>Cancel</Button>
            <Button onClick={executeStart} className="bg-status-success hover:bg-status-success/90">
              Confirm Start ({impact.count} Labs)
            </Button>
          </>
        }
      >
        <div className="bg-muted/30 p-4 rounded-lg border flex flex-col space-y-4">
          <div className="flex items-start space-x-3">
            <ShieldAlert className="h-5 w-5 text-status-alert mt-0.5" />
            <p className="text-sm text-foreground">
              You are about to queue start commands for <strong>{impact.count}</strong> offline labs.
              The controller will process these in batches of 5 to prevent rate limiting.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="bg-card p-3 rounded border flex items-center space-x-3">
              <div className="p-2 bg-primary/10 text-primary rounded">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Est. vCPU Impact</p>
                <p className="text-lg font-bold">+{impact.cpu} Cores</p>
              </div>
            </div>
            <div className="bg-card p-3 rounded border flex items-center space-x-3">
              <div className="p-2 bg-primary/10 text-primary rounded">
                <MemoryStick className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Est. RAM Impact</p>
                <p className="text-lg font-bold">+{impact.ram.toFixed(1)} GB</p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
