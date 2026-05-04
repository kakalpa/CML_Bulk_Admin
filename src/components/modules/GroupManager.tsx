import React, { useState, useEffect } from "react"
import { Users, Plus, Trash2, UserPlus, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/auth"

interface Group {
  id: string
  name: string
  description: string
  members_count: number
}

export function GroupManager() {
  const { status: authStatus } = useAuthStore()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")

  const fetchGroups = async () => {
    if (authStatus !== 'connected') return
    setLoading(true)
    try {
      const res = await api.get('/groups')
      const groupData = await Promise.all(res.data.map(async (id: string) => {
        const detail = await api.get(`/groups/${id}`)
        const members = await api.get(`/groups/${id}/users`)
        return {
          id: detail.data.id,
          name: detail.data.name,
          description: detail.data.description,
          members_count: members.data.length
        }
      }))
      setGroups(groupData)
    } catch (err) {
      console.error("Failed to fetch groups", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [authStatus])

  const handleCreateGroup = async () => {
    if (!newGroupName) return
    try {
      await api.post('/groups', {
        name: newGroupName,
        description: `Created via Bulk Admin on ${new Date().toLocaleDateString()}`
      })
      setNewGroupName("")
      fetchGroups()
    } catch (err) {
      console.error("Failed to create group", err)
    }
  }

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("Are you sure you want to delete this group?")) return
    try {
      await api.delete(`/groups/${id}`)
      fetchGroups()
    } catch (err) {
      console.error("Failed to delete group", err)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Group Manager</h1>
          <p className="text-muted-foreground mt-1">Manage student class groups and shared lab permissions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Create New Group</CardTitle>
            <CardDescription>Add a new class or project group.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Group Name</label>
              <Input 
                placeholder="e.g. CS101-Morning" 
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleCreateGroup} disabled={!newGroupName || loading}>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Existing Groups</CardTitle>
            <CardDescription>Overview of all groups currently registered in CML.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 mr-2 text-primary/60" />
                        {group.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-bold">
                        {group.members_count} Students
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteGroup(group.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {groups.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      No groups found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
