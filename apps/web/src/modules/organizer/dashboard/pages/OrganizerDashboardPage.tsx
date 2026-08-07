import { useAuth } from '@/app/providers/AuthProvider'

/**
 * Placeholder landing page for the organizer area. Replace with the real
 * dashboard (tournaments summary, registrations, action items, etc.) when
 * that feature is built.
 */
export function OrganizerDashboardPage() {
  const { user } = useAuth()

  return (
    <section>
      <h1>Welcome, {user?.displayName}</h1>
      <p>Your organizer dashboard will appear here.</p>
    </section>
  )
}
