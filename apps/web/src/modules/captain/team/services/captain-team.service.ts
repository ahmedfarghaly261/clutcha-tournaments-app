import { useCaptainsControllerGetTeam } from '@/api/generated/captain/captain'
import type {
  CaptainTeam,
  CaptainTeamFormValues,
  CreateCaptainTeam,
  UpdateCaptainTeam,
} from '../types/captain-team.types'

export const captainTeamDefaultValues: CaptainTeamFormValues = {
  name: '',
  description: '',
  gameKey: 'valorant',
  region: '',
  discordServerUrl: '',
}

export function mapCaptainTeamToFormValues(team: CaptainTeam): CaptainTeamFormValues {
  return {
    name: team.name,
    description: team.description ?? '',
    gameKey: team.gameKey,
    region: team.region ?? '',
    discordServerUrl: team.discordServerUrl ?? '',
  }
}

export function mapFormValuesToCreateCaptainTeam(
  values: CaptainTeamFormValues,
): CreateCaptainTeam {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    gameKey: values.gameKey.trim(),
    region: values.region.trim() || null,
    discordServerUrl: values.discordServerUrl.trim() || null,
  }
}

export function mapFormValuesToUpdateCaptainTeam(
  values: CaptainTeamFormValues,
): UpdateCaptainTeam {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    gameKey: values.gameKey.trim(),
    region: values.region.trim() || null,
    discordServerUrl: values.discordServerUrl.trim() || null,
  }
}

export function useCaptainTeamService() {
  return useCaptainsControllerGetTeam({
    query: {
      retry: false,
      staleTime: 15_000,
    },
  })
}
