import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  RegistrationApprovalStatus,
  TournamentFormat,
  TournamentRegistrationStatus,
  TournamentSeedingMethod,
  TournamentStatus,
} from '@clutcha/database';
import { DatabaseService } from '../../../database/database.service';
import { type GenerateOrganizerBracketDto } from '../dtos/generate-organizer-bracket.dto';
import {
  type OrganizerBracketMatchDto,
  type OrganizerBracketResponseDto,
} from '../dtos/organizer-bracket-response.dto';
import {
  generateSingleEliminationBracket,
  getSingleEliminationBracketSize,
} from './single-elimination-bracket.generator';

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

const organizerBracketRegistrationSelect = {
  team: {
    select: {
      id: true,
      name: true,
      logoUrl: true,
    },
  },
} satisfies Prisma.TournamentRegistrationSelect;

const organizerBracketMatchSelect = {
  id: true,
  stage: true,
  round: true,
  bracketPosition: true,
  bestOf: true,
  scheduledAt: true,
  status: true,
  teamAScore: true,
  teamBScore: true,
  winnerTeamId: true,
  officialResultStatus: true,
  onlineServerInfo: true,
  gamingRoomId: true,
  onsiteStationLabel: true,
  teamA: {
    select: {
      id: true,
      name: true,
      logoUrl: true,
    },
  },
  teamB: {
    select: {
      id: true,
      name: true,
      logoUrl: true,
    },
  },
  gamingRoom: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.TournamentMatchSelect;

type OrganizerBracketRegistrationRecord =
  Prisma.TournamentRegistrationGetPayload<{
    select: typeof organizerBracketRegistrationSelect;
  }>;

type OrganizerBracketMatchRecord = Prisma.TournamentMatchGetPayload<{
  select: typeof organizerBracketMatchSelect;
}>;

@Injectable()
export class TournamentBracketService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getOrganizerTournamentBracket(
    organizerId: string,
    tournamentId: string,
  ): Promise<OrganizerBracketResponseDto> {
    const tournament = await this.findOwnedTournamentOrThrow(
      organizerId,
      tournamentId,
    );
    const [registrations, matches] = await Promise.all([
      this.findApprovedBracketRegistrations(tournamentId),
      this.databaseService.client.tournamentMatch.findMany({
        where: { tournamentId },
        orderBy: [{ round: 'asc' }, { bracketPosition: 'asc' }],
        select: organizerBracketMatchSelect,
      }),
    ]);

    return this.toOrganizerBracketResponse(tournament, registrations, matches);
  }

  async generateOrganizerTournamentBracket(
    organizerId: string,
    tournamentId: string,
    dto: GenerateOrganizerBracketDto,
  ): Promise<OrganizerBracketResponseDto> {
    await this.databaseService.client.$transaction(async (transaction) => {
      const tournament = await this.findOwnedTournamentOrThrow(
        organizerId,
        tournamentId,
        transaction,
      );

      this.assertTournamentCanGenerateBracket(tournament);

      const registrations = await this.findApprovedBracketRegistrations(
        tournamentId,
        transaction,
      );
      const approvedTeamIds = registrations.map(
        (registration) => registration.team.id,
      );

      if (approvedTeamIds.length < 2) {
        throw new ConflictException(
          'At least two approved teams are required to generate a bracket.',
        );
      }

      this.assertOrderedTeamsMatchApprovedTeams(
        dto.orderedTeamIds,
        approvedTeamIds,
      );

      const existingMatchCount = await transaction.tournamentMatch.count({
        where: { tournamentId },
      });
      if (existingMatchCount > 0) {
        throw new ConflictException(
          'A bracket has already been generated for this tournament.',
        );
      }

      const orderedTeamIds =
        tournament.seedingMethod === TournamentSeedingMethod.RANDOM
          ? this.shuffleTeamIds(dto.orderedTeamIds)
          : dto.orderedTeamIds;
      const generated = generateSingleEliminationBracket(
        orderedTeamIds,
        tournament.defaultBestOf,
        tournament.finalBestOf,
        tournament.thirdPlaceMatch,
      );

      await transaction.tournamentMatch.createMany({
        data: generated.matches.map((match) => ({
          tournamentId,
          stage: match.stage,
          round: match.round,
          bracketPosition: match.bracketPosition,
          bestOf: match.bestOf,
          teamAId: match.teamAId,
          teamBId: match.teamBId,
        })),
      });
    });

    return this.getOrganizerTournamentBracket(organizerId, tournamentId);
  }

  private async findOwnedTournamentOrThrow(
    organizerId: string,
    tournamentId: string,
    client: Pick<Prisma.TransactionClient, 'tournament'> = this.databaseService
      .client,
  ): Promise<Prisma.TournamentGetPayload<{ select: typeof tournamentSelect }>> {
    const tournament = await client.tournament.findFirst({
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

  private async findApprovedBracketRegistrations(
    tournamentId: string,
    client: Pick<Prisma.TransactionClient, 'tournamentRegistration'> = this
      .databaseService.client,
  ): Promise<OrganizerBracketRegistrationRecord[]> {
    return client.tournamentRegistration.findMany({
      where: {
        tournamentId,
        approvalStatus: RegistrationApprovalStatus.APPROVED,
        status: {
          in: [
            TournamentRegistrationStatus.CONFIRMED,
            TournamentRegistrationStatus.CHECKED_IN,
          ],
        },
      },
      orderBy: [{ approvedAt: 'asc' }, { submittedAt: 'asc' }],
      select: organizerBracketRegistrationSelect,
    });
  }

  private assertTournamentCanGenerateBracket(
    tournament: Prisma.TournamentGetPayload<{
      select: typeof tournamentSelect;
    }>,
  ): void {
    if (tournament.format !== TournamentFormat.SINGLE_ELIMINATION) {
      throw new ConflictException(
        'This bracket generator currently supports single-elimination tournaments only.',
      );
    }

    if (
      tournament.status !== TournamentStatus.REGISTRATION_CLOSED &&
      tournament.status !== TournamentStatus.CHECK_IN_OPEN
    ) {
      throw new ConflictException(
        'Close tournament registration before generating the bracket.',
      );
    }
  }

  private assertOrderedTeamsMatchApprovedTeams(
    orderedTeamIds: string[],
    approvedTeamIds: string[],
  ): void {
    const orderedTeamIdSet = new Set(orderedTeamIds);
    const approvedTeamIdSet = new Set(approvedTeamIds);
    const containsEveryApprovedTeam = approvedTeamIds.every((teamId) =>
      orderedTeamIdSet.has(teamId),
    );
    const containsOnlyApprovedTeams = orderedTeamIds.every((teamId) =>
      approvedTeamIdSet.has(teamId),
    );

    if (
      orderedTeamIdSet.size !== orderedTeamIds.length ||
      orderedTeamIds.length !== approvedTeamIds.length ||
      !containsEveryApprovedTeam ||
      !containsOnlyApprovedTeams
    ) {
      throw new ConflictException(
        'orderedTeamIds must contain every approved tournament team exactly once.',
      );
    }
  }

  private shuffleTeamIds(teamIds: string[]): string[] {
    const shuffled = [...teamIds];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [
        shuffled[randomIndex],
        shuffled[index],
      ];
    }
    return shuffled;
  }

  private toOrganizerBracketResponse(
    tournament: Prisma.TournamentGetPayload<{
      select: typeof tournamentSelect;
    }>,
    registrations: OrganizerBracketRegistrationRecord[],
    matches: OrganizerBracketMatchRecord[],
  ): OrganizerBracketResponseDto {
    const bracketSize = getSingleEliminationBracketSize(registrations.length);
    const totalRounds = bracketSize > 0 ? Math.log2(bracketSize) : 0;
    const rounds = new Map<
      number,
      OrganizerBracketResponseDto['rounds'][number]
    >();

    matches.forEach((match) => {
      const round = rounds.get(match.round) ?? {
        round: match.round,
        label: this.getBracketRoundLabel(match.round, totalRounds),
        matches: [],
      };
      round.matches.push(this.toOrganizerBracketMatch(match));
      rounds.set(match.round, round);
    });

    return {
      tournament: {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status,
        format: tournament.format,
        seedingMethod: tournament.seedingMethod,
        mode: tournament.mode,
        timezone: tournament.timezone,
      },
      generated: matches.length > 0,
      teamCount: registrations.length,
      bracketSize,
      approvedTeams: registrations.map((registration) => registration.team),
      rounds: Array.from(rounds.values()),
    };
  }

  private toOrganizerBracketMatch(
    match: OrganizerBracketMatchRecord,
  ): OrganizerBracketMatchDto {
    return {
      id: match.id,
      stage: match.stage,
      round: match.round,
      bracketPosition: match.bracketPosition ?? `R${match.round}`,
      bestOf: match.bestOf,
      scheduledAt: match.scheduledAt,
      status: match.status,
      teamA: match.teamA,
      teamB: match.teamB,
      teamAScore: match.teamAScore,
      teamBScore: match.teamBScore,
      winnerTeamId: match.winnerTeamId,
      officialResultStatus: match.officialResultStatus,
      onlineServerInfo: match.onlineServerInfo,
      gamingRoomId: match.gamingRoomId,
      gamingRoomName: match.gamingRoom?.name ?? null,
      onsiteStationLabel: match.onsiteStationLabel,
    };
  }

  private getBracketRoundLabel(round: number, totalRounds: number): string {
    const roundsRemaining = totalRounds - round;
    if (roundsRemaining === 0) return 'Final';
    if (roundsRemaining === 1) return 'Semifinals';
    if (roundsRemaining === 2) return 'Quarterfinals';
    return `Round ${round}`;
  }
}
