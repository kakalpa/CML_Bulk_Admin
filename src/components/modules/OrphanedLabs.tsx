import React, { useState, useEffect } from "react"
import { Ghost, Trash2, RefreshCcw, ShieldAlert, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/auth"

interface OrphanedLab {
  id: string
  title: string
  owner_username: string
  owner_id: string
  node_count: number
}

export function OrphanedLabs() {
  const { status: authStatus } = useAuthStore()
  const [orphans, setOrphans] = useState<OrphanedLab[]>([])
  const [loading, setLoading] = useState(false)

  const findOrphans = async () => {
    if (authStatus !== 'connected') return
    setLoading(true)
    try {
      // 1. Get all users
      const usersRes = await api.get('/users')
      const activeUserIds = new Set(usersRes.data.map((u: any) => u.id))

      // 2. Get all labs
      const labsRes = await api.get('/labs')
      const labIds = labsRes.data as string[]

      const orphanedList: OrphanedLab[] = []
      
      await Promise.all(labIds.map(async (id) => {
        const lab = await api.get(`/labs/${id}`)
        // If owner_id is not in activeUserIds, it's an orphan
        if (!activeUserIds.has(lab.data.owner)) {
          orphanedList.push({
            id: lab.data.id,
            title: lab.data.lab_title,
            owner_username: lab.data.owner_username || 'Deleted User',
            owner_id: lab.data.owner,
            node_count: lab.data.node_count
          })
        }
      }))
      
      setOrphans(orphanedList)
    } catch (err) {
      console.error("Failed to scan for orphaned labs", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    findOrphans()
  }, [authStatus])

  const handleDeleteOrphan = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this orphaned lab?")) return
    try {
      await api.delete(`/labs/${id}`)
      findOrphans()
    } catch (err) {
      console.error("Failed to delete orphaned lab", err)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Orphaned Labs</h1>
          <p className="text-muted-foreground mt-1">Identify and remove labs owned by deleted users to reclaim resources.</p>
        </div>
        <Button onClick={findOrphans} disabled={loading} variant="outline">
          <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Scan System
        </Button>
      </div>

      <div className="bg-status-alert/10 border border-status-alert/20 text-status-alert p-4 rounded-lg flex items-start space-x-3">
        <ShieldAlert className="h-5 w-5 mt-0.5" />
        <div>
          <p className="text-sm font-bold">Resource Warning</p>
          <p className="text-sm opacity-90">Orphaned labs continue to consume disk space and can sometimes reserve RAM if they were left running when the user was deleted.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detected Orphans</CardTitle>
          <CardDescription>Labs that no longer have a valid owner registered in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lab Title</TableHead>
                <TableHead>Original Owner</TableHead>
                <TableHead>Nodes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orphans.map((lab) => (
                <TableRow key={lab.id}>
                  <TableCell className="font-medium">{lab.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center text-muted-foreground italic">
                      <UserX className="h-3 w-3 mr-1" />
                      {lab.owner_username}
                    </div>
                  </TableCell>
                  <TableCell>{lab.node_count}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteOrphan(lab.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {orphans.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="p-3 bg-status-success/10 rounded-full text-status-success">
                        <RefreshCcw className="h-6 w-6" />
                      </div>
                      <p className="text-muted-foreground">No orphaned labs detected. Your system is clean!</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
