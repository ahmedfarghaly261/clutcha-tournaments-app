import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  organizerRegistrationSchema,
  type OrganizerRegistrationFormValues,
} from '../schemas/organizer-registration.schema'
import { useOrganizerRegistration } from '../hooks/useOrganizerRegistration'

export function OrganizerRegistrationForm() {
  const { register: registerOrganizer } = useOrganizerRegistration()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OrganizerRegistrationFormValues>({
    resolver: zodResolver(organizerRegistrationSchema),
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await registerOrganizer(values)
    } catch {
      setFormError('Could not create your organizer account. Please try again.')
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate>
      <div>
        <label htmlFor="organizer-display-name">Display name</label>
        <input
          id="organizer-display-name"
          type="text"
          autoComplete="organization"
          {...register('displayName')}
        />
        {errors.displayName && <p role="alert">{errors.displayName.message}</p>}
      </div>
      <div>
        <label htmlFor="organizer-email">Email</label>
        <input id="organizer-email" type="email" autoComplete="email" {...register('email')} />
        {errors.email && <p role="alert">{errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor="organizer-password">Password</label>
        <input
          id="organizer-password"
          type="password"
          autoComplete="new-password"
          {...register('password')}
        />
        {errors.password && <p role="alert">{errors.password.message}</p>}
      </div>
      {formError && <p role="alert">{formError}</p>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account…' : 'Create organizer account'}
      </button>
    </form>
  )
}
