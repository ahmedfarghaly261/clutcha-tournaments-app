import { z } from 'zod'
import { CreateCaptainRosterPlayerDtoRosterType } from '@/api/generated/captain'
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

const captainTeamFields = {
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
    .min(1, 'Choose a team region')
    .max(80, 'Region must be 80 characters or less'),
  discordServerUrl: optionalHttpsUrl,
  captainGamerTag: z.string().trim().max(80, 'Gamer tag must be 80 characters or less'),
  captainGameAccountId: z.string().trim().max(120, 'Game account ID must be 120 characters or less'),
  captainRank: z.string().trim().max(80, 'Rank must be 80 characters or less'),
  captainCountry: z.string().trim().max(80, 'Country must be 80 characters or less'),
  captainRosterType: z.enum([
    CreateCaptainRosterPlayerDtoRosterType.STARTER,
    CreateCaptainRosterPlayerDtoRosterType.SUBSTITUTE,
  ]),
}

export const captainTeamCreateSchema = z.object({
  ...captainTeamFields,
  captainGamerTag: captainTeamFields.captainGamerTag.min(2, 'Gamer tag must be at least 2 characters'),
  captainGameAccountId: captainTeamFields.captainGameAccountId.min(2, 'Game account ID must be at least 2 characters'),
}) satisfies z.ZodType<CaptainTeamFormValues>

export const captainTeamUpdateSchema = z.object(captainTeamFields) satisfies z.ZodType<CaptainTeamFormValues>
