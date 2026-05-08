import React, { useState, useEffect } from "react"
import { UploadCloud, Users, Trash2, KeyRound, FolderPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { useAuthStore } from "@/store/auth"
import { api } from "@/lib/api"
import { AlertTriangle } from "lucide-react"
import Papa from "papaparse"

interface Student {
  username: string
  fullname: string
  email: string
  group: string
  id?: string
  status?: "pending" | "success" | "error"
  errorMsg?: string
}

export function StudentSync() {
  const [students, setStudents] = useState<Student[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const [groups, setGroups] = useState<{id: string, name: string}[]>([])
  const [selectedAssignGroup, setSelectedAssignGroup] = useState<string>("")
  
  const { status: authStatus } = useAuthStore()

  useEffect(() => {
    if (authStatus === 'connected') {
      api.get('/groups').then(res => {
        const groupData = res.data.map((g: any) => ({ id: g.id, name: g.name }))
        setGroups(groupData)
        if (groupData.length > 0) setSelectedAssignGroup(groupData[0].id)
      }).catch(err => console.error("Failed to fetch groups for dropdown", err))
    }
  }, [authStatus])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        let data = results.data as string[][]
        
        // Basic heuristic: if the first row contains 'username' or 'email' or 'id', it's likely a header
        const firstRow = data[0].join('').toLowerCase()
        if (firstRow.includes('username') || firstRow.includes('email') || firstRow.includes('id')) {
          data = data.slice(1) // skip header
        }

        const parsed = data.map(row => ({
          username: row[0] || '',
          fullname: row[1] || '',
          email: row[2] || '',
          group: row[3] || 'students',
          status: 'pending' as const
        })).filter(s => s.username)
        
        // Append instead of replace so we can mix existing and imported
        setStudents(prev => {
          const newStudents = [...prev]
          const newlyAdded: string[] = []
          parsed.forEach(p => {
            if (!newStudents.find(s => s.username === p.username)) {
              newStudents.push(p)
              newlyAdded.push(p.username)
            }
          })
          
          // Auto-select the newly imported users so the user can immediately click "Create"
          if (newlyAdded.length > 0) {
            setSelected(prevSelected => {
              const next = new Set(prevSelected)
              newlyAdded.forEach(id => next.add(id))
              return next
            })
          }
          
          return newStudents
        })
      }
    })
  }

  const handleFetchExisting = async () => {
    setIsProcessing(true)
    try {
      // Fetch both users and groups to map UUIDs to names
      const [usersRes, groupsRes] = await Promise.all([
        api.get('/users'),
        api.get('/groups')
      ])

      const groupMap = groupsRes.data.reduce((acc: any, g: any) => {
        acc[g.id] = g.name
        return acc
      }, {})

      const existing: Student[] = usersRes.data.map((u: any) => {
        const groupId = u.groups?.[0]
        return {
          username: u.username,
          fullname: u.fullname || '',
          email: u.email || '',
          group: groupId ? (groupMap[groupId] || groupId) : 'unknown',
          id: u.id,
          status: 'success'
        }
      })
      
      setStudents(prev => {
        const merged = [...prev]
        existing.forEach(e => {
          if (!merged.find(s => s.username === e.username)) {
            merged.push(e)
          }
        })
        return merged
      })
    } catch (err) {
      console.error("Failed to fetch users", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleSelectAll = () => {
    if (selected.size === students.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(students.map(s => s.username)))
    }
  }

  const toggleSelect = (username: string) => {
    const next = new Set(selected)
    if (next.has(username)) next.delete(username)
    else next.add(username)
    setSelected(next)
  }

  const handleBulkCreate = async () => {
    if (selected.size === 0) return
    setIsProcessing(true)
    setProgress(0)

    const targetStudents = students.filter(s => selected.has(s.username))
    let completed = 0

    // Real bulk creation with rate limit delay
    for (const student of targetStudents) {
      try {
        await api.post('/users', {
          username: student.username,
          password: "CML-User-123!", // More complex default password to avoid policy errors
          fullname: student.fullname,
          email: student.email,
          admin: false
        })
        
        setStudents(prev => prev.map(s => 
          s.username === student.username ? { ...s, status: 'success', errorMsg: undefined } : s
        ))
      } catch (err: any) {
        const msg = err.response?.data?.description || err.message
        console.error(`Failed to create user ${student.username}`, msg)
        setStudents(prev => prev.map(s => 
          s.username === student.username ? { ...s, status: 'error', errorMsg: msg } : s
        ))
      }
      
      completed++
      setProgress((completed / targetStudents.length) * 100)
      if (completed < targetStudents.length) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }

    setIsProcessing(false)
  }

  const handleBulkSetPassword = async () => {
    if (selected.size === 0) return
    const newPassword = window.prompt("Enter new password for selected users:")
    if (!newPassword) return

    setIsProcessing(true)
    setProgress(0)
    
    const targetStudents = students.filter(s => selected.has(s.username))
    let completed = 0

    for (const student of targetStudents) {
      try {
        if (!student.id) {
          const userRes = await api.get(`/users/${student.username}/id`)
          student.id = userRes.data
        }
        
        await api.patch(`/users/${student.id}`, {
          password: {
            new_password: newPassword,
            old_password: "" // Admin can override with empty old password
          }
        })
      } catch (err: any) {
        console.error(`Failed to set password for ${student.username}`, err.response?.data || err.message)
      }
      
      completed++
      setProgress((completed / targetStudents.length) * 100)
    }
    
    setIsProcessing(false)
    alert(`Password updated for ${completed} users.`)
  }

  const handleBulkAssignGroup = async () => {
    if (selected.size === 0 || !selectedAssignGroup) return
    setIsProcessing(true)
    setProgress(0)

    try {
      // 1. Get existing members of the target group
      const groupRes = await api.get(`/groups/${selectedAssignGroup}`)
      const currentMembers = new Set<string>(groupRes.data.members || [])
      
      const targetStudents = students.filter(s => selected.has(s.username))
      
      // 2. Resolve IDs for target students and add to the set
      for (const student of targetStudents) {
        if (!student.id) {
          try {
            const userRes = await api.get(`/users/${student.username}/id`)
            student.id = userRes.data
          } catch(e) { continue }
        }
        if (student.id) currentMembers.add(student.id)
      }

      // 3. Patch the group with the newly combined member list
      await api.patch(`/groups/${selectedAssignGroup}`, {
        members: Array.from(currentMembers)
      })

      // Update local state to reflect the new group
      const groupName = groups.find(g => g.id === selectedAssignGroup)?.name || selectedAssignGroup
      setStudents(prev => prev.map(s => 
        selected.has(s.username) ? { ...s, group: groupName } : s
      ))
      
      setSelected(new Set())
    } catch (err) {
      console.error("Failed to assign users to group", err)
      alert("Failed to assign users to group. Check console for details.")
    }

    setIsProcessing(false)
  }

  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    setIsProcessing(true)
    setProgress(0)

    const targetStudents = students.filter(s => selected.has(s.username))
    let completed = 0

    // Real bulk deletion with rate limit delay
    for (const student of targetStudents) {
      if (!student.id) {
        // We need the ID to delete. If we don't have it, try to fetch it or skip
        const userRes = await api.get(`/users/${student.username}/id`)
        student.id = userRes.data
      }

      try {
        await api.delete(`/users/${student.id}`)
        setStudents(prev => prev.filter(s => s.username !== student.username))
      } catch (err) {
        console.error(`Failed to delete user ${student.username}`, err)
      }
      
      completed++
      setProgress((completed / targetStudents.length) * 100)
      if (completed < targetStudents.length) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }

    setSelected(new Set())
    setIsProcessing(false)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Student Sync</h1>
          <p className="text-muted-foreground mt-1">Bulk provision and manage student accounts from CSV/JSON.</p>
        </div>
      </div>

      {authStatus !== 'connected' && (
        <div className="bg-status-alert/10 border border-status-alert/20 text-status-alert p-4 rounded-lg flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm font-medium">Please connect to a CML Controller in the header to enable API actions.</p>
        </div>
      )}

      {students.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <UploadCloud className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Import Student List</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Upload a CSV file containing <code className="text-xs">username</code>, <code className="text-xs">fullname</code>, and <code className="text-xs">email</code> columns (with or without headers).
            </p>
            <div className="flex space-x-4">
              <div className="relative">
                <input 
                  type="file" 
                  accept=".csv,.json"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                />
                <Button>Select File</Button>
              </div>
              <Button variant="secondary" onClick={handleFetchExisting} disabled={isProcessing || authStatus !== 'connected'}>
                <Users className="h-4 w-4 mr-2" />
                Load Existing Users
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <div>
              <CardTitle>User Records</CardTitle>
              <CardDescription>{students.length} records found</CardDescription>
            </div>
            <div className="flex space-x-2">
              <div className="relative">
                <input 
                  type="file" 
                  accept=".csv,.json"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                />
                <Button variant="outline" size="sm">
                  <UploadCloud className="h-4 w-4 mr-2" />
                  Import More
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={handleFetchExisting} disabled={isProcessing || authStatus !== 'connected'}>
                <Users className="h-4 w-4 mr-2" />
                Fetch API
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setStudents([]); setSelected(new Set()); }}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          
          {students.some(s => s.status === 'pending') && selected.size === 0 && (
            <div className="bg-primary/5 text-primary p-3 px-6 border-b text-sm font-medium flex items-center">
              You have imported users that are not yet created in CML. Select them using the checkboxes to provision them.
            </div>
          )}

          {selected.size > 0 && (
            <div className="bg-primary/5 border-b p-3 flex items-center justify-between px-6">
              <span className="text-sm font-medium">{selected.size} selected</span>
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleBulkCreate} disabled={isProcessing || authStatus !== 'connected'}>
                  <Users className="h-4 w-4 mr-2" />
                  Create Users
                </Button>
                <Button size="sm" variant="secondary" onClick={handleBulkSetPassword} disabled={isProcessing || authStatus !== 'connected'}>
                  <KeyRound className="h-4 w-4 mr-2" />
                  Set Passwords
                </Button>
                
                {groups.length > 0 && (
                  <div className="flex items-center space-x-1 border-l border-primary/20 pl-2 ml-2">
                    <select 
                      className="text-sm bg-transparent border border-input rounded-md px-2 py-1 h-8"
                      value={selectedAssignGroup}
                      onChange={(e) => setSelectedAssignGroup(e.target.value)}
                    >
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                    <Button size="sm" variant="outline" onClick={handleBulkAssignGroup} disabled={isProcessing || authStatus !== 'connected'}>
                      <FolderPlus className="h-4 w-4 mr-2" />
                      Assign Group
                    </Button>
                  </div>
                )}

                <Button size="sm" variant="destructive" onClick={handleBulkDelete} disabled={isProcessing || authStatus !== 'connected'}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="p-4 border-b bg-muted/30">
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span>Processing API Requests...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          <div className="max-h-[500px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-[50px]">
                    <input 
                      type="checkbox" 
                      className="rounded border-input text-primary focus:ring-primary"
                      checked={selected.size === students.length && students.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.username} data-state={selected.has(s.username) ? 'selected' : undefined}>
                    <TableCell>
                      <input 
                        type="checkbox" 
                        className="rounded border-input text-primary focus:ring-primary"
                        checked={selected.has(s.username)}
                        onChange={() => toggleSelect(s.username)}
                      />
                    </TableCell>
                    <TableCell className="font-mono">{s.username}</TableCell>
                    <TableCell>{s.fullname}</TableCell>
                    <TableCell>{s.group}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        {s.status === 'success' && <span className="text-status-success text-xs font-semibold px-2 py-1 bg-status-success/10 rounded-full w-fit">Created</span>}
                        {s.status === 'error' && (
                          <div className="flex flex-col space-y-1">
                            <span className="text-status-error text-xs font-semibold px-2 py-1 bg-status-error/10 rounded-full w-fit">Error</span>
                            {s.errorMsg && <span className="text-[10px] text-status-error font-medium max-w-[150px] truncate" title={s.errorMsg}>{s.errorMsg}</span>}
                          </div>
                        )}
                        {s.status === 'pending' && <span className="text-muted-foreground text-xs font-medium px-2 py-1 bg-muted rounded-full w-fit">Ready to Create</span>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  )
}
