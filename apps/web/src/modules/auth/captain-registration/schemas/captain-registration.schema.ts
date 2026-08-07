import { z } from 'zod'

export const captainRegistrationSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Must be at least 2 characters')
    .max(80, 'Must be at most 80 characters'),
  email: z.string().min(1, 'Email is required').max(254).email('Enter a valid email address'),
  password: z
    .string()
    .min(12, 'Must be at least 12 characters')
    .max(128, 'Must be at most 128 characters'),
})

export type CaptainRegistrationFormValues = z.infer<typeof captainRegistrationSchema>
