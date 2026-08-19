import { z } from 'zod'
import type { CaptainTeamFormValues } from '../types/captain-team.types'

const optionalHttpsUrl = z
  .string()
  .trim()
  .max(2048, 'URL must be 2048 characters or less')
  .refine(
    (value) => {
      if (!value) return true

      try {
        return new URL(value).protocol === 'https:'
      } catch {
        return false
      }
    },
    'Enter a valid HTTPS URL',
  )

export const captainTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Team name must be at least 2 characters')
    .max(120, 'Team name must be 120 characters or less'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description must be 1000 characters or less'),
  gameKey: z
    .string()
    .trim()
    .min(2, 'Choose the team’s primary game')
    .max(64, 'Game key must be 64 characters or less'),
  region: z
    .string()
    .trim()
    .max(80, 'Region must be 80 characters or less'),
  discordServerUrl: optionalHttpsUrl,
}) satisfies z.ZodType<CaptainTeamFormValues>
