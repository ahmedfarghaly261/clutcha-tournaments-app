import {
  type TournamentFormat,
  type TournamentMode,
  type TournamentStatus,
} from '@clutcha/database';
import { type PublicTournamentSummaryResponseDto } from '../dtos/public-tournament-summary-response.dto';

export type PublicTournamentRecord = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  gameKey: string;
  mode: TournamentMode;
  status: TournamentStatus;
  format: TournamentFormat;
  minimumTeams: number;
  maximumTeams: number;
  minimumStarters: number;
  maximumStarters: number;
  registrationFee: { toString(): string };
  currency: string;
  prizePool: { toString(): string };
  registrationClosesAt: Date;
  startsAt: Date;
  endsAt: Date | null;
  timezone: string;
  waitlistEnabled: boolean;
  publishedAt: Date | null;
  registrationOpenedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export const toPublicTournamentSummaryResponse = (
  tournament: PublicTournamentRecord,
): PublicTournamentSummaryResponseDto => ({
  id: tournament.id,
  slug: tournament.slug,
  name: tournament.name,
  shortDescription: tournament.shortDescription,
  logoUrl: tournament.logoUrl,
  coverUrl: tournament.coverUrl,
  gameKey: tournament.gameKey,
  mode: tournament.mode,
  status: tournament.status,
  format: tournament.format,
  minimumTeams: tournament.minimumTeams,
  maximumTeams: tournament.maximumTeams,
  minimumStarters: tournament.minimumStarters,
  maximumStarters: tournament.maximumStarters,
  registrationFee: tournament.registrationFee.toString(),
  currency: tournament.currency,
  prizePool: tournament.prizePool.toString(),
  registrationClosesAt: tournament.registrationClosesAt,
  startsAt: tournament.startsAt,
  endsAt: tournament.endsAt,
  timezone: tournament.timezone,
  waitlistEnabled: tournament.waitlistEnabled,
  publishedAt: tournament.publishedAt,
  registrationOpenedAt: tournament.registrationOpenedAt,
  createdAt: tournament.createdAt,
  updatedAt: tournament.updatedAt,
});
