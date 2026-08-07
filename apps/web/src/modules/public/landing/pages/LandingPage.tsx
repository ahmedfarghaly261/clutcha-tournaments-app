import { Link } from 'react-router-dom'

export function LandingPage() {
  return (
    <section>
      <h1>CLUTCHA</h1>
      <p>Online and on-site esports tournaments.</p>
      <p>
        <Link to="/sign-in">Sign in</Link>
      </p>
      <p>
        <Link to="/register/captain">Register your team</Link>
      </p>
      <p>
        <Link to="/register/organizer">Register as an organizer</Link>
      </p>
    </section>
  )
}
