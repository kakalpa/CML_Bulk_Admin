import React from "react"
import { Server, Users, Laptop, RotateCcw, Activity, Ghost, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/auth"

interface AppLayoutProps {
  children: React.ReactNode
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function AppLayout({ children, activeTab, setActiveTab }: AppLayoutProps) {
  const disconnect = useAuthStore((state) => state.disconnect)
  const tabs = [
    { id: "students", label: "Student Sync", icon: Users },
    { id: "groups", label: "Group Manager", icon: Users },
    { id: "labs", label: "Lab Lifecycle", icon: Laptop },
    { id: "orphans", label: "Orphaned Labs", icon: Ghost },
    { id: "health", label: "System Health", icon: Activity },
    { id: "reset", label: "Classroom Reset", icon: RotateCcw },
  ]

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col hidden md:flex">
        <div className="p-6 border-b flex items-center space-x-3">
          <Server className="h-8 w-8 text-primary" />
          <span className="font-bold text-lg tracking-tight">CML2 Bulk Admin</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            )
          })}
        </nav>
        <div className="p-4 border-t space-y-3">
          <Button
            variant="outline"
            size="sm"
            onClick={disconnect}
            className="w-full justify-start"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
          <div className="text-xs text-muted-foreground">
            Cisco Modern UI Engine
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header - Connection Module placeholder */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center space-x-2 md:hidden">
            <Server className="h-6 w-6 text-primary" />
            <span className="font-bold">CML2</span>
          </div>
          <div id="header-connection-portal" className="flex-1 ml-4" />
        </header>

        {/* Action Canvas */}
        <main className="flex-1 overflow-auto bg-muted/20 p-6">
          <div className="max-w-7xl mx-auto min-h-full">
            {children}
          </div>
        </main>
        
        {/* API Monitor Drawer Portal */}
        <div id="api-monitor-portal" />
      </div>
    </div>
  )
}
