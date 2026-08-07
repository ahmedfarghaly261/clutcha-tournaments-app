import { useAuth } from '@/app/providers/AuthProvider'

/**
 * Placeholder landing page for the captain area. Replace with the real
 * dashboard (roster status, upcoming matches, action items, etc.) when that
 * feature is built.
 */
export function CaptainDashboardPage() {
  const { user } = useAuth()

  return (
    <section>
      <h1>Welcome, {user?.displayName}</h1>
      <p>Your captain dashboard will appear here.</p>
    </section>
  )
}
