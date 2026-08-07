import { Link } from 'react-router-dom'
import { OrganizerRegistrationForm } from '../components/OrganizerRegistrationForm'

export function OrganizerRegistrationPage() {
  return (
    <section>
      <h1>Register as an organizer</h1>
      <OrganizerRegistrationForm />
      <p>
        Already have an account? <Link to="/sign-in">Sign in</Link>
      </p>
    </section>
  )
}
