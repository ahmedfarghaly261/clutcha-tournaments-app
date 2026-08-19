import { z } from 'zod'
import type { CaptainProfileFormValues } from '../types/captain-profile.types'

const internationalPhonePattern = /^\+[1-9]\d{7,14}$/

export const captainProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters')
    .max(80, 'Display name must be 80 characters or less'),
  email: z.string().email(),
  phoneNumber: z
    .string()
    .trim()
    .refine(
      (value) => value.length === 0 || internationalPhonePattern.test(value),
      'Use international format, for example +201001234567',
    ),
  discordUsername: z
    .string()
    .trim()
    .max(80, 'Discord username must be 80 characters or less'),
}) satisfies z.ZodType<CaptainProfileFormValues>
