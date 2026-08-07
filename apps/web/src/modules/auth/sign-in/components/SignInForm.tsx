import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInSchema, type SignInFormValues } from '../schemas/sign-in.schema'
import { useSignIn } from '../hooks/useSignIn'

export function SignInForm() {
  const { signIn } = useSignIn()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({ resolver: zodResolver(signInSchema) })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await signIn(values)
    } catch {
      setFormError('Invalid email or password.')
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate>
      <div>
        <label htmlFor="sign-in-email">Email</label>
        <input id="sign-in-email" type="email" autoComplete="email" {...register('email')} />
        {errors.email && <p role="alert">{errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor="sign-in-password">Password</label>
        <input
          id="sign-in-password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
        />
        {errors.password && <p role="alert">{errors.password.message}</p>}
      </div>
      {formError && <p role="alert">{formError}</p>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
