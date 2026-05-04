import React, { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { ConnectionHeader } from '@/components/modules/ConnectionHeader'
import { StudentSync } from '@/components/modules/StudentSync'
import { GroupManager } from '@/components/modules/GroupManager'
import { LabLifecycle } from '@/components/modules/LabLifecycle'
import { OrphanedLabs } from '@/components/modules/OrphanedLabs'
import { SystemHealth } from '@/components/modules/SystemHealth'
import { ClassroomReset } from '@/components/modules/ClassroomReset'
import { ApiMonitorDrawer } from '@/components/modules/ApiMonitorDrawer'
import { createPortal } from 'react-dom'

function App() {
  const [activeTab, setActiveTab] = useState('students')

  return (
    <AppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {/* Portals to inject components into the layout shell without deep prop drilling */}
      {document.getElementById('header-connection-portal') && 
        createPortal(<ConnectionHeader />, document.getElementById('header-connection-portal')!)
      }
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
