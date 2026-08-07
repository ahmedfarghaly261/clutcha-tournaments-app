import { Link } from 'react-router-dom'
import { CaptainRegistrationForm } from '../components/CaptainRegistrationForm'

export function CaptainRegistrationPage() {
  return (
    <section>
      <h1>Register your team</h1>
      <CaptainRegistrationForm />
      <p>
        Already have an account? <Link to="/sign-in">Sign in</Link>
      </p>
    </section>
  )
}
