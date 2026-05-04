import React, { useState } from "react"
import { RotateCcw, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export function ClassroomReset() {
  const [group, setGroup] = useState("")
  const [isResetting, setIsResetting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!group) return
    
    setIsResetting(true)
    setResetSuccess(false)
    
    // Simulate finding all labs for group and resetting
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsResetting(false)
    setResetSuccess(true)
    setTimeout(() => setResetSuccess(false), 5000)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground text-center">Classroom Reset Utility</h1>
        <p className="text-muted-foreground mt-2 text-center">
          Identify all labs belonging to a specific group/class and "Reset to Baseline" in one click.
        </p>
      </div>

      <Card className="border-destructive/20 shadow-md">
        <form onSubmit={handleReset}>
          <CardHeader>
            <div className="flex items-center space-x-2 text-destructive mb-2">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle className="text-lg">Danger Zone</CardTitle>
            </div>
            <CardDescription>
              This action will forcefully stop all labs for the specified group, wipe all node disks, and reset configurations to their initial state. <strong>Student progress will be lost.</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Target Group Name
              </label>
              <Input 
                placeholder="e.g. CS101-Fall2026" 
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Exact group name match is required.
              </p>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t flex justify-between items-center py-4">
            {resetSuccess ? (
              <span className="text-sm font-medium text-status-success animate-in fade-in">
                Baseline reset initiated for {group}!
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">
                Double check the group name before proceeding.
              </span>
            )}
            
            <Button 
              type="submit" 
              variant="destructive" 
              disabled={isResetting || !group}
            >
              {isResetting ? (
                <>
                  <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                  Resetting Labs...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Baseline
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
