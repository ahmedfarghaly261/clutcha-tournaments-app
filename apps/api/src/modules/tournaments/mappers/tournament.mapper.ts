import {
  type TournamentFormat,
  type TournamentMode,
  type TournamentSeedingMethod,
  type TournamentStatus,
  type TournamentVisibility,
} from '@clutcha/database';
import { type TournamentResponseDto } from '../dtos/tournament-response.dto';

export type TournamentRecord = Omit<
  TournamentResponseDto,
  'registrationFee' | 'prizePool'
> & {
  mode: TournamentMode;
  visibility: TournamentVisibility;
  status: TournamentStatus;
  format: TournamentFormat;
  seedingMethod: TournamentSeedingMethod;
  registrationFee: { toString(): string };
  prizePool: { toString(): string };
};

export const toTournamentResponse = (
  tournament: TournamentRecord,
): TournamentResponseDto => ({
  id: tournament.id,
  organizerId: tournament.organizerId,
  name: tournament.name,
  slug: tournament.slug,
  shortDescription: tournament.shortDescription,
  description: tournament.description,
  logoUrl: tournament.logoUrl,
  coverUrl: tournament.coverUrl,
  gameKey: tournament.gameKey,
  mode: tournament.mode,
  visibility: tournament.visibility,
  status: tournament.status,
  format: tournament.format,
  minimumTeams: tournament.minimumTeams,
  maximumTeams: tournament.maximumTeams,
  minimumStarters: tournament.minimumStarters,
  maximumStarters: tournament.maximumStarters,
  maximumSubstitutes: tournament.maximumSubstitutes,
  defaultBestOf: tournament.defaultBestOf,
  finalBestOf: tournament.finalBestOf,
  seedingMethod: tournament.seedingMethod,
  thirdPlaceMatch: tournament.thirdPlaceMatch,
  requiredGameAccountId: tournament.requiredGameAccountId,
  allowedRegion: tournament.allowedRegion,
  allowedCountries: tournament.allowedCountries,
  allowedPlatforms: tournament.allowedPlatforms,
  minimumPlayerAge: tournament.minimumPlayerAge,
  minimumRank: tournament.minimumRank,
  maximumRank: tournament.maximumRank,
  registrationFee: tournament.registrationFee.toString(),
  currency: tournament.currency,
  prizePool: tournament.prizePool.toString(),
  prizeDistribution: tournament.prizeDistribution,
  refundPolicy: tournament.refundPolicy,
  cancellationPolicy: tournament.cancellationPolicy,
  rules: tournament.rules,
  rulesVersion: tournament.rulesVersion,
  rosterChangeRules: tournament.rosterChangeRules,
  checkInRules: tournament.checkInRules,
  matchReportingRules: tournament.matchReportingRules,
  evidenceRequirements: tournament.evidenceRequirements,
  disputeDeadlineMinutes: tournament.disputeDeadlineMinutes,
  forfeitRules: tournament.forfeitRules,
  codeOfConduct: tournament.codeOfConduct,
  registrationOpensAt: tournament.registrationOpensAt,
  registrationClosesAt: tournament.registrationClosesAt,
  rosterLocksAt: tournament.rosterLocksAt,
  checkInOpensAt: tournament.checkInOpensAt,
  checkInClosesAt: tournament.checkInClosesAt,
  startsAt: tournament.startsAt,
  endsAt: tournament.endsAt,
  timezone: tournament.timezone,
  waitlistEnabled: tournament.waitlistEnabled,
  maximumWaitlistSize: tournament.maximumWaitlistSize,
  manualApprovalRequired: tournament.manualApprovalRequired,
  publishedAt: tournament.publishedAt,
  registrationOpenedAt: tournament.registrationOpenedAt,
  registrationClosedAt: tournament.registrationClosedAt,
  cancelledAt: tournament.cancelledAt,
  cancellationReason: tournament.cancellationReason,
  createdAt: tournament.createdAt,
  updatedAt: tournament.updatedAt,
});
