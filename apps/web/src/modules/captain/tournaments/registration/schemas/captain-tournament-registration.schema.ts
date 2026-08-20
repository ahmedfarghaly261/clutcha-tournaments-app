import { z } from 'zod'
import type { CaptainTournamentRegistrationFormValues } from '../types/captain-tournament-registration.types'

export const captainTournamentRegistrationSchema = z.object({
  acceptRules: z.boolean().refine((value) => value, {
    message: 'You must accept the tournament rules before registering.',
  }),
}) satisfies z.ZodType<CaptainTournamentRegistrationFormValues>
