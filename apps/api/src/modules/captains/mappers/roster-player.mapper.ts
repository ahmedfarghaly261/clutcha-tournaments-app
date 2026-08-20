import { type RosterPlayerResponseDto } from '../dto/roster-player-response.dto';

type RosterPlayerRecord = {
  id: string;
  gamerTag: string;
  realName: string | null;
  gameAccountId: string;
  phoneNumber: string;
  email: string | null;
  discordUsername: string | null;
  rank: string | null;
  country: string | null;
  rosterType: RosterPlayerResponseDto['rosterType'];
  verificationStatus: RosterPlayerResponseDto['verificationStatus'];
  eligibilityStatus: RosterPlayerResponseDto['eligibilityStatus'];
  teamId: string;
  captainUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const toRosterPlayerResponse = (
  player: RosterPlayerRecord,
): RosterPlayerResponseDto => ({
  id: player.id,
  gamerTag: player.gamerTag,
  realName: player.realName,
  gameAccountId: player.gameAccountId,
  phoneNumber: player.phoneNumber,
  email: player.email,
  discordUsername: player.discordUsername,
  rank: player.rank,
  country: player.country,
  rosterType: player.rosterType,
  verificationStatus: player.verificationStatus,
  eligibilityStatus: player.eligibilityStatus,
  teamId: player.teamId,
  isCaptain: player.captainUserId !== null,
  createdAt: player.createdAt,
  updatedAt: player.updatedAt,
});

export const toRosterPlayerResponses = (
  players: RosterPlayerRecord[],
): RosterPlayerResponseDto[] => players.map(toRosterPlayerResponse);
