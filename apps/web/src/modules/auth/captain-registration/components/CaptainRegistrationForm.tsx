import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  captainRegistrationSchema,
  type CaptainRegistrationFormValues,
} from '../schemas/captain-registration.schema'
import { useCaptainRegistration } from '../hooks/useCaptainRegistration'

export function CaptainRegistrationForm() {
  const { register: registerCaptain } = useCaptainRegistration()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CaptainRegistrationFormValues>({ resolver: zodResolver(captainRegistrationSchema) })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await registerCaptain(values)
    } catch {
      setFormError('Could not create your captain account. Please try again.')
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate>
      <div>
        <label htmlFor="captain-display-name">Display name</label>
        <input id="captain-display-name" type="text" autoComplete="name" {...register('displayName')} />
        {errors.displayName && <p role="alert">{errors.displayName.message}</p>}
      </div>
      <div>
        <label htmlFor="captain-email">Email</label>
        <input id="captain-email" type="email" autoComplete="email" {...register('email')} />
        {errors.email && <p role="alert">{errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor="captain-password">Password</label>
        <input
          id="captain-password"
          type="password"
          autoComplete="new-password"
          {...register('password')}
        />
        {errors.password && <p role="alert">{errors.password.message}</p>}
      </div>
      {formError && <p role="alert">{formError}</p>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account…' : 'Create captain account'}
      </button>
    </form>
  )
}
