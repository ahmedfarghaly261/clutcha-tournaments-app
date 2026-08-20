import { CreateCaptainRosterPlayerDtoRosterType } from '@/api/generated/captain'
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
  captainGamerTag: '',
  captainGameAccountId: '',
  captainRank: '',
  captainCountry: '',
  captainRosterType: CreateCaptainRosterPlayerDtoRosterType.STARTER,
}

export function transformCaptainTeamToFormValues(team: CaptainTeam): CaptainTeamFormValues {
  return {
    ...captainTeamDefaultValues,
    name: team.name,
    description: team.description ?? '',
    gameKey: team.gameKey,
    region: team.region ?? '',
    discordServerUrl: team.discordServerUrl ?? '',
  }
}

function optionalString(value: string): string | null {
  return value.trim() || null
}

export function transformFormValuesToCreateCaptainTeam(
  values: CaptainTeamFormValues,
): CreateCaptainTeam {
  return {
    name: values.name.trim(),
    description: optionalString(values.description),
    gameKey: values.gameKey.trim(),
    region: optionalString(values.region),
    discordServerUrl: optionalString(values.discordServerUrl),
    captainRosterPlayer: {
      gamerTag: values.captainGamerTag.trim(),
      gameAccountId: values.captainGameAccountId.trim(),
      rank: optionalString(values.captainRank),
      country: optionalString(values.captainCountry),
      rosterType: values.captainRosterType,
    },
  }
}

export function transformFormValuesToUpdateCaptainTeam(
  values: CaptainTeamFormValues,
): UpdateCaptainTeam {
  return {
    name: values.name.trim(),
    description: optionalString(values.description),
    gameKey: values.gameKey.trim(),
    region: optionalString(values.region),
    discordServerUrl: optionalString(values.discordServerUrl),
  }
}
