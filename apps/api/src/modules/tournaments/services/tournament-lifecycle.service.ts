import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TournamentStatus } from '@clutcha/database';
import { DatabaseService } from '../../../database/database.service';
import { type TournamentResponseDto } from '../dtos/tournament-response.dto';
import { toTournamentResponse } from '../mappers/tournament.mapper';

const tournamentSelect = {
  id: true,
  organizerId: true,
  name: true,
  slug: true,
  shortDescription: true,
  description: true,
  logoUrl: true,
  coverUrl: true,
  gameKey: true,
  mode: true,
  visibility: true,
  status: true,
  format: true,
  minimumTeams: true,
  maximumTeams: true,
  minimumStarters: true,
  maximumStarters: true,
  maximumSubstitutes: true,
  defaultBestOf: true,
  finalBestOf: true,
  seedingMethod: true,
  thirdPlaceMatch: true,
  requiredGameAccountId: true,
  allowedRegion: true,
  allowedCountries: true,
  allowedPlatforms: true,
  minimumPlayerAge: true,
  minimumRank: true,
  maximumRank: true,
  registrationFee: true,
  currency: true,
  prizePool: true,
  prizeDistribution: true,
  refundPolicy: true,
  cancellationPolicy: true,
  rules: true,
  rulesVersion: true,
  rosterChangeRules: true,
  checkInRules: true,
  matchReportingRules: true,
  evidenceRequirements: true,
  disputeDeadlineMinutes: true,
  forfeitRules: true,
  codeOfConduct: true,
  registrationOpensAt: true,
  registrationClosesAt: true,
  rosterLocksAt: true,
  checkInOpensAt: true,
  checkInClosesAt: true,
  startsAt: true,
  endsAt: true,
  timezone: true,
  waitlistEnabled: true,
  maximumWaitlistSize: true,
  manualApprovalRequired: true,
  publishedAt: true,
  registrationOpenedAt: true,
  registrationClosedAt: true,
  cancelledAt: true,
  cancellationReason: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TournamentSelect;

@Injectable()
export class TournamentLifecycleService {
  constructor(private readonly databaseService: DatabaseService) {}

  async openRegistration(
    organizerId: string,
    tournamentId: string,
  ): Promise<TournamentResponseDto> {
    const updated = await this.databaseService.client.$transaction(
      async (transaction) => {
        const tournament = await this.findOwnedTournamentOrThrow(
          transaction,
          organizerId,
          tournamentId,
        );

        this.assertLifecycleStatus(
          tournament.status,
          [TournamentStatus.PUBLISHED],
          'Only published tournaments can open registration.',
        );

        const openedAt = new Date();

        return transaction.tournament.update({
          where: { id: tournament.id },
          data: {
            status: TournamentStatus.REGISTRATION_OPEN,
            registrationOpenedAt: openedAt,
            registrationOpensAt:
              tournament.registrationOpensAt > openedAt
                ? openedAt
                : tournament.registrationOpensAt,
            registrationClosedAt: null,
          },
          select: tournamentSelect,
        });
      },
    );

    return toTournamentResponse(updated);
  }

  async closeRegistration(
    organizerId: string,
    tournamentId: string,
  ): Promise<TournamentResponseDto> {
    const updated = await this.databaseService.client.$transaction(
      async (transaction) => {
        const tournament = await this.findOwnedTournamentOrThrow(
          transaction,
          organizerId,
          tournamentId,
        );

        this.assertLifecycleStatus(
          tournament.status,
          [TournamentStatus.REGISTRATION_OPEN],
          'Only registration-open tournaments can close registration.',
        );

        return transaction.tournament.update({
          where: { id: tournament.id },
          data: {
            status: TournamentStatus.REGISTRATION_CLOSED,
            registrationClosedAt: new Date(),
          },
          select: tournamentSelect,
        });
      },
    );

    return toTournamentResponse(updated);
  }

  async openCheckIn(
    organizerId: string,
    tournamentId: string,
  ): Promise<TournamentResponseDto> {
    const updated = await this.databaseService.client.$transaction(
      async (transaction) => {
        const tournament = await this.findOwnedTournamentOrThrow(
          transaction,
          organizerId,
          tournamentId,
        );

        this.assertLifecycleStatus(
          tournament.status,
          [TournamentStatus.REGISTRATION_CLOSED],
          'Only registration-closed tournaments can open check-in.',
        );

        const openedAt = new Date();

        return transaction.tournament.update({
          where: { id: tournament.id },
          data: {
            status: TournamentStatus.CHECK_IN_OPEN,
            checkInOpensAt:
              !tournament.checkInOpensAt || tournament.checkInOpensAt > openedAt
                ? openedAt
                : tournament.checkInOpensAt,
          },
          select: tournamentSelect,
        });
      },
    );

    return toTournamentResponse(updated);
  }

  async cancel(
    organizerId: string,
    tournamentId: string,
    reason: string,
  ): Promise<TournamentResponseDto> {
    const updated = await this.databaseService.client.$transaction(
      async (transaction) => {
        const tournament = await this.findOwnedTournamentOrThrow(
          transaction,
          organizerId,
          tournamentId,
        );

        this.assertLifecycleStatus(
          tournament.status,
          [
            TournamentStatus.DRAFT,
            TournamentStatus.PUBLISHED,
            TournamentStatus.REGISTRATION_OPEN,
            TournamentStatus.REGISTRATION_CLOSED,
            TournamentStatus.CHECK_IN_OPEN,
            TournamentStatus.IN_PROGRESS,
            TournamentStatus.POSTPONED,
          ],
          'This tournament cannot be cancelled from its current status.',
        );

        return transaction.tournament.update({
          where: { id: tournament.id },
          data: {
            status: TournamentStatus.CANCELLED,
            cancelledAt: new Date(),
            cancellationReason: reason,
          },
          select: tournamentSelect,
        });
      },
    );

    return toTournamentResponse(updated);
  }

  private async findOwnedTournamentOrThrow(
    transaction: Pick<Prisma.TransactionClient, 'tournament'>,
    organizerId: string,
    tournamentId: string,
  ): Promise<Prisma.TournamentGetPayload<{ select: typeof tournamentSelect }>> {
    const tournament = await transaction.tournament.findFirst({
      where: {
        id: tournamentId,
        organizerId,
      },
      select: tournamentSelect,
    });

    if (!tournament) {
      throw new NotFoundException('Tournament was not found');
    }

    return tournament;
  }

  private assertLifecycleStatus(
    actual: TournamentStatus,
    allowed: readonly TournamentStatus[],
    message: string,
  ): void {
    if (!allowed.includes(actual)) {
      throw new ConflictException(message);
    }
  }
}
