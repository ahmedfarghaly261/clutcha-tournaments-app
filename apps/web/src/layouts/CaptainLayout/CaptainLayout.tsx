import { Outlet } from 'react-router-dom'
import { CaptainSidebar } from './components/CaptainSidebar'

export function CaptainLayout() {
  return (
    <div className="flex min-h-screen items-start bg-[#090b0f] text-[#e8edf5]">
      <CaptainSidebar />
      <main className="min-h-screen min-w-0 flex-1 px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}
