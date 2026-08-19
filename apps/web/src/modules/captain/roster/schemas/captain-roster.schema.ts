import { z } from 'zod'
import { CreateRosterPlayerDtoRosterType } from '@/api/generated/captain'
import type { RosterPlayerFormValues } from '../types/captain-roster.types'

const optionalText = (maximum: number, label: string) =>
  z.string().trim().max(maximum, `${label} must be ${maximum} characters or less`)

export const captainRosterPlayerSchema = z.object({
  gamerTag: z.string().trim().min(2, 'Gamer tag must be at least 2 characters').max(80),
  realName: optionalText(120, 'Real name'),
  gameAccountId: z.string().trim().min(2, 'Game account ID must be at least 2 characters').max(120),
  phoneNumber: z.string().trim().regex(/^\+[1-9]\d{7,14}$/, 'Use international format, for example +201001234567'),
  email: z.string().trim().max(254).refine(
    (value) => !value || z.string().email().safeParse(value).success,
    'Enter a valid email address',
  ),
  discordUsername: optionalText(80, 'Discord username'),
  rank: optionalText(80, 'Rank'),
  country: optionalText(80, 'Country'),
  rosterType: z.enum([
    CreateRosterPlayerDtoRosterType.STARTER,
    CreateRosterPlayerDtoRosterType.SUBSTITUTE,
  ]),
}) satisfies z.ZodType<RosterPlayerFormValues>
