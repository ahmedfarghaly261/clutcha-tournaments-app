import { z } from 'zod'

export const registrationAccountTypes = ['captain', 'organizer'] as const

export type RegistrationAccountType = (typeof registrationAccountTypes)[number]

export const registrationSchema = z
  .object({
    accountType: z.enum(registrationAccountTypes),
    displayName: z
      .string()
      .trim()
      .min(2, 'Enter at least 2 characters')
      .max(120, 'Must be at most 120 characters'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, 'Email is required')
      .max(254, 'Email is too long')
      .email('Enter a valid email address'),
    password: z
      .string()
      .min(12, 'Password must be at least 12 characters')
      .max(128, 'Password must be at most 128 characters'),
    region: z.string().optional(),
    termsAccepted: z.boolean(),
  })
  .superRefine((values, context) => {
    if (values.accountType === 'captain' && values.displayName.length > 80) {
      context.addIssue({
        code: 'custom',
        path: ['displayName'],
        message: 'Captain display name must be at most 80 characters',
      })
    }

    if (!values.termsAccepted) {
      context.addIssue({
        code: 'custom',
        path: ['termsAccepted'],
        message: 'Accept the terms to create an account',
      })
    }
  })

export type RegistrationFormValues = z.infer<typeof registrationSchema>
