import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/components/LoginPage'
import { StudentSync } from '@/components/modules/StudentSync'
import { GroupManager } from '@/components/modules/GroupManager'
import { LabLifecycle } from '@/components/modules/LabLifecycle'
import { OrphanedLabs } from '@/components/modules/OrphanedLabs'
import { SystemHealth } from '@/components/modules/SystemHealth'
import { ClassroomReset } from '@/components/modules/ClassroomReset'
import { ApiMonitorDrawer } from '@/components/modules/ApiMonitorDrawer'
import { useAuthStore } from '@/store/auth'

function App() {
  const [activeTab, setActiveTab] = useState('students')
  const status = useAuthStore((state) => state.status)
  const touchSession = useAuthStore((state) => state.touchSession)
  const checkSession = useAuthStore((state) => state.checkSession)

  useEffect(() => {
    checkSession()

    const activityEvents = ['click', 'keydown', 'mousemove', 'touchstart'] as const
    const handleActivity = () => touchSession()

    activityEvents.forEach((event) => window.addEventListener(event, handleActivity))
    const interval = window.setInterval(checkSession, 60 * 1000)

    return () => {
      activityEvents.forEach((event) => window.removeEventListener(event, handleActivity))
      window.clearInterval(interval)
    }
  }, [touchSession, checkSession])

  if (status !== 'connected') {
    return <LoginPage />
  }

  return (
    <AppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {document.getElementById('api-monitor-portal') && 
        createPortal(<ApiMonitorDrawer />, document.getElementById('api-monitor-portal')!)
      }

      {/* Main Content Router */}
      {activeTab === 'students' && <StudentSync />}
      {activeTab === 'groups' && <GroupManager />}
      {activeTab === 'labs' && <LabLifecycle />}
      {activeTab === 'orphans' && <OrphanedLabs />}
      {activeTab === 'health' && <SystemHealth />}
      {activeTab === 'reset' && <ClassroomReset />}
    </AppLayout>
  )
}

export default App
