import { useAuth } from '@/app/providers/AuthProvider'

/**
 * Placeholder landing page for the organizer area. Replace with the real
 * dashboard (tournaments summary, registrations, action items, etc.) when
 * that feature is built.
 */
export function OrganizerDashboardPage() {
  const { user } = useAuth()

  return (
    <section className="rounded-xl border border-[#27272a] bg-[#18181b] p-6 shadow-[0_0_80px_rgba(132,43,210,0.08)]">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.05em] text-[#ddb7ff]">
        Organizer Command Center
      </p>
      <h1 className="mb-2 text-3xl font-bold tracking-[-0.03em] text-[#e5e1e4]">
        Welcome, {user?.displayName}
      </h1>
      <p className="max-w-2xl text-sm leading-6 text-[#cfc2d6]">
        Your organizer dashboard will appear here.
      </p>
    </section>
  )
}
