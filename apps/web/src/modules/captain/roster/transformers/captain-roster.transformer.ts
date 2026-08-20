import { CreateRosterPlayerDtoRosterType } from '@/api/generated/captain'
import type {
  CaptainRosterMemberFormValues,
  CreateCaptainRosterPlayer,
  CreateRosterPlayer,
  RosterPlayer,
  RosterPlayerFormValues,
  UpdateRosterPlayer,
} from '../types/captain-roster.types'

export const captainRosterMemberDefaultValues: CaptainRosterMemberFormValues = {
  gamerTag: '',
  gameAccountId: '',
  rank: '',
  country: '',
  rosterType: CreateRosterPlayerDtoRosterType.STARTER,
}

export const rosterPlayerDefaultValues: RosterPlayerFormValues = {
  gamerTag: '',
  realName: '',
  gameAccountId: '',
  phoneNumber: '',
  email: '',
  discordUsername: '',
  rank: '',
  country: '',
  rosterType: CreateRosterPlayerDtoRosterType.STARTER,
}

export function transformRosterPlayerToFormValues(
  player: RosterPlayer,
): RosterPlayerFormValues {
  return {
    gamerTag: player.gamerTag,
    realName: player.realName ?? '',
    gameAccountId: player.gameAccountId,
    phoneNumber: player.phoneNumber,
    email: player.email ?? '',
    discordUsername: player.discordUsername ?? '',
    rank: player.rank ?? '',
    country: player.country ?? '',
    rosterType: player.rosterType,
  }
}

function transformOptionalString(value: string): string | null {
  const normalizedValue = value.trim()
  return normalizedValue || null
}

export function transformFormValuesToCreateCaptainRosterPlayer(
  values: CaptainRosterMemberFormValues,
): CreateCaptainRosterPlayer {
  return {
    gamerTag: values.gamerTag.trim(),
    gameAccountId: values.gameAccountId.trim(),
    rank: transformOptionalString(values.rank),
    country: transformOptionalString(values.country),
    rosterType: values.rosterType,
  }
}

export function transformFormValuesToCreateRosterPlayer(
  values: RosterPlayerFormValues,
): CreateRosterPlayer {
  return {
    gamerTag: values.gamerTag.trim(),
    realName: transformOptionalString(values.realName),
    gameAccountId: values.gameAccountId.trim(),
    phoneNumber: values.phoneNumber.trim(),
    email: transformOptionalString(values.email)?.toLowerCase() ?? null,
    discordUsername: transformOptionalString(values.discordUsername),
    rank: transformOptionalString(values.rank),
    country: transformOptionalString(values.country),
    rosterType: values.rosterType,
  }
}

export function transformFormValuesToUpdateRosterPlayer(
  values: RosterPlayerFormValues,
): UpdateRosterPlayer {
  return transformFormValuesToCreateRosterPlayer(values)
}
