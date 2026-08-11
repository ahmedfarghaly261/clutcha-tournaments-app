import { Outlet } from 'react-router-dom'
import { OrganizerSidebar } from './components/OrganizerSidebar'

export function OrganizerLayout() {
  return (
    <div className="flex min-h-screen items-start bg-[#09090b] text-[#e5e1e4]">
      <OrganizerSidebar />
      <main className="min-h-screen min-w-0 flex-1 px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}
