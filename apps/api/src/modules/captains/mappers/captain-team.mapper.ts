import { type CaptainTeamResponseDto } from '../dto/captain-team-response.dto';

type CaptainTeamRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  gameKey: string;
  region: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  discordServerUrl: string | null;
  status: CaptainTeamResponseDto['status'];
  captainId: string;
  createdAt: Date;
  updatedAt: Date;
};

export const toCaptainTeamResponse = (
  team: CaptainTeamRecord,
): CaptainTeamResponseDto => ({
  id: team.id,
  name: team.name,
  slug: team.slug,
  description: team.description,
  gameKey: team.gameKey,
  region: team.region,
  logoUrl: team.logoUrl,
  coverUrl: team.coverUrl,
  discordServerUrl: team.discordServerUrl,
  status: team.status,
  captainId: team.captainId,
  createdAt: team.createdAt,
  updatedAt: team.updatedAt,
});
