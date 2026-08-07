import { Link } from 'react-router-dom'
import { SignInForm } from '../components/SignInForm'

export function SignInPage() {
  return (
    <section>
      <h1>Sign in</h1>
      <SignInForm />
      <p>
        New captain? <Link to="/register/captain">Register your team</Link>
      </p>
      <p>
        New organizer? <Link to="/register/organizer">Register as an organizer</Link>
      </p>
    </section>
  )
}
