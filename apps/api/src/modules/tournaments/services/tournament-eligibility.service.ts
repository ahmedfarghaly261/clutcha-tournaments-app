import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  EligibilityStatus,
  Prisma,
  RegistrationApprovalStatus,
  RegistrationPaymentStatus,
  RosterType,
  TeamStatus,
  TournamentRegistrationStatus,
  TournamentStatus,
  TournamentVisibility,
  UserRole,
} from '@clutcha/database';
import { DatabaseService } from '../../../database/database.service';
import { type CreateTournamentRegistrationDto } from '../dtos/create-tournament-registration.dto';
import {
  TournamentEligibilityIssueCode,
  type TournamentEligibilityIssueDto,
  type TournamentEligibilityResponseDto,
} from '../dtos/tournament-eligibility-response.dto';
import { type TournamentRegistrationResponseDto } from '../dtos/tournament-registration-response.dto';

type EligibilityCaptain = Prisma.UserGetPayload<{
  select: typeof eligibilityCaptainSelect;
}>;

type EligibilityTeam = Prisma.TeamGetPayload<{
  select: typeof eligibilityTeamSelect;
}>;

type EligibilityTournament = Prisma.TournamentGetPayload<{
  select: typeof eligibilityTournamentSelect;
}>;

type RegistrationRecord = Prisma.TournamentRegistrationGetPayload<{
  select: typeof tournamentRegistrationSelect;
}>;

const eligibilityCaptainSelect = {
  id: true,
  email: true,
  displayName: true,
  phoneNumber: true,
  discordUsername: true,
  role: true,
} satisfies Prisma.UserSelect;

const eligibilityTeamSelect = {
  id: true,
  name: true,
  gameKey: true,
  region: true,
  status: true,
  rosterPlayers: {
    select: {
      id: true,
      gamerTag: true,
      realName: true,
      gameAccountId: true,
      phoneNumber: true,
      email: true,
      discordUsername: true,
      country: true,
      rank: true,
      rosterType: true,
      eligibilityStatus: true,
    },
  },
} satisfies Prisma.TeamSelect;

const eligibilityTournamentSelect = {
  id: true,
  gameKey: true,
  visibility: true,
  status: true,
  maximumTeams: true,
  minimumStarters: true,
  maximumStarters: true,
  maximumSubstitutes: true,
  requiredGameAccountId: true,
  allowedRegion: true,
  allowedCountries: true,
  allowedPlatforms: true,
  minimumRank: true,
  maximumRank: true,
  registrationOpensAt: true,
  registrationClosesAt: true,
  registrationOpenedAt: true,
  cancelledAt: true,
} satisfies Prisma.TournamentSelect;

const registrationTournamentSelect = {
  id: true,
  slug: true,
  name: true,
  gameKey: true,
  mode: true,
  visibility: true,
  status: true,
  maximumTeams: true,
  minimumStarters: true,
  maximumStarters: true,
  maximumSubstitutes: true,
  requiredGameAccountId: true,
  allowedRegion: true,
  allowedCountries: true,
  allowedPlatforms: true,
  minimumRank: true,
  maximumRank: true,
  registrationFee: true,
  currency: true,
  rulesVersion: true,
  registrationOpensAt: true,
  registrationClosesAt: true,
  registrationOpenedAt: true,
  startsAt: true,
  cancelledAt: true,
} satisfies Prisma.TournamentSelect;

const tournamentRegistrationSelect = {
  id: true,
  status: true,
  paymentStatus: true,
  approvalStatus: true,
  rulesVersion: true,
  rulesAcceptedAt: true,
  submittedAt: true,
  tournament: {
    select: {
      id: true,
      slug: true,
      name: true,
      gameKey: true,
      mode: true,
      registrationFee: true,
      currency: true,
      startsAt: true,
    },
  },
  team: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.TournamentRegistrationSelect;

type RegistrationContext = {
  activeRegistrationCount: number;
  existingTeamRegistrationCount: number;
};

type RosterSnapshotItem = {
  rosterPlayerId: string;
  gamerTag: string;
  realName: string | null;
  gameAccountId: string;
  phoneNumber: string;
  email: string | null;
  discordUsername: string | null;
  rosterType: RosterType;
  rank: string | null;
  country: string | null;
};

type CaptainContactSnapshot = {
  displayName: string;
  email: string;
  phoneNumber: string | null;
  discordUsername: string | null;
};

const activeRegistrationStatuses = [
  TournamentRegistrationStatus.PENDING_PAYMENT,
  TournamentRegistrationStatus.PENDING_APPROVAL,
  TournamentRegistrationStatus.CONFIRMED,
  TournamentRegistrationStatus.WAITLISTED,
  TournamentRegistrationStatus.CHECKED_IN,
  TournamentRegistrationStatus.REFUND_PENDING,
] as const;

@Injectable()
export class TournamentEligibilityService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getCaptainTournamentEligibility(
    captainId: string,
    tournamentId: string,
  ): Promise<TournamentEligibilityResponseDto> {
    const [captain, team, tournament] = await Promise.all([
      this.databaseService.client.user.findFirst({
        where: {
          id: captainId,
          role: UserRole.CAPTAIN,
        },
        select: eligibilityCaptainSelect,
      }),
      this.databaseService.client.team.findUnique({
        where: { captainId },
        select: eligibilityTeamSelect,
      }),
      this.databaseService.client.tournament.findUnique({
        where: { id: tournamentId },
        select: eligibilityTournamentSelect,
      }),
    ]);

    if (!captain) {
      throw new NotFoundException('Captain profile was not found');
    }

    if (!team) {
      throw new UnprocessableEntityException('Captain team was not found');
    }

    if (!tournament) {
      throw new NotFoundException('Tournament was not found');
    }

    const registrationContext = await this.getRegistrationContextForEligibility(
      tournament.id,
      team.id,
    );
    const issues = this.evaluateTournamentEligibility(
      captain,
      team,
      tournament,
      new Date(),
      registrationContext,
    );

    return {
      eligible: issues.length === 0,
      team: {
        id: team.id,
        name: team.name,
      },
      issues,
    };
  }

  async createCaptainTournamentRegistration(
    captainId: string,
    tournamentId: string,
    dto: CreateTournamentRegistrationDto,
  ): Promise<TournamentRegistrationResponseDto> {
    if (dto.acceptRules !== true) {
      throw new BadRequestException('Tournament rules must be accepted.');
    }

    try {
      const registration = await this.databaseService.client.$transaction(
        async (transaction) => {
          const [captain, team, tournament] = await Promise.all([
            transaction.user.findFirst({
              where: {
                id: captainId,
                role: UserRole.CAPTAIN,
              },
              select: eligibilityCaptainSelect,
            }),
            transaction.team.findUnique({
              where: { captainId },
              select: eligibilityTeamSelect,
            }),
            transaction.tournament.findUnique({
              where: { id: tournamentId },
              select: registrationTournamentSelect,
            }),
          ]);

          if (!captain) {
            throw new NotFoundException('Captain profile was not found');
          }

          if (!team) {
            throw new UnprocessableEntityException(
              'Captain team was not found',
            );
          }

          if (!tournament) {
            throw new NotFoundException('Tournament was not found');
          }

          const registrationContext =
            await this.getRegistrationContextForEligibility(
              tournament.id,
              team.id,
              transaction,
            );

          if (registrationContext.existingTeamRegistrationCount > 0) {
            throw new ConflictException(
              'Team is already registered for this tournament.',
            );
          }

          const issues = this.evaluateTournamentEligibility(
            captain,
            team,
            tournament,
            new Date(),
            registrationContext,
          );

          if (issues.length > 0) {
            throw new UnprocessableEntityException({
              message: 'Captain team is not eligible for this tournament.',
              issues,
            });
          }

          const paidTournament =
            Number(tournament.registrationFee.toString()) > 0;
          const now = new Date();

          return transaction.tournamentRegistration.create({
            data: {
              tournamentId: tournament.id,
              teamId: team.id,
              captainId: captain.id,
              status: paidTournament
                ? TournamentRegistrationStatus.PENDING_PAYMENT
                : TournamentRegistrationStatus.PENDING_APPROVAL,
              paymentStatus: paidTournament
                ? RegistrationPaymentStatus.AWAITING_PROOF
                : RegistrationPaymentStatus.NOT_REQUIRED,
              approvalStatus: RegistrationApprovalStatus.PENDING,
              rosterSnapshot: this.createRosterSnapshot(team),
              captainContactSnapshot:
                this.createCaptainContactSnapshot(captain),
              rulesVersion: tournament.rulesVersion,
              rulesAcceptedAt: now,
              submittedAt: now,
            },
            select: tournamentRegistrationSelect,
          });
        },
      );

      return this.toTournamentRegistrationResponse(registration);
    } catch (error) {
      if (this.isPrismaUniqueConstraintError(error)) {
        throw new ConflictException(
          'Team is already registered for this tournament.',
        );
      }

      throw error;
    }
  }

  private async getRegistrationContextForEligibility(
    tournamentId: string,
    teamId: string,
    client: Prisma.TransactionClient | DatabaseService['client'] = this
      .databaseService.client,
  ): Promise<RegistrationContext> {
    const [activeRegistrationCount, existingTeamRegistrationCount] =
      await Promise.all([
        client.tournamentRegistration.count({
          where: {
            tournamentId,
            status: {
              in: [...activeRegistrationStatuses],
            },
          },
        }),
        client.tournamentRegistration.count({
          where: {
            tournamentId,
            teamId,
          },
        }),
      ]);

    return {
      activeRegistrationCount,
      existingTeamRegistrationCount,
    };
  }

  private evaluateTournamentEligibility(
    captain: EligibilityCaptain,
    team: EligibilityTeam,
    tournament: EligibilityTournament,
    now: Date,
    registrationContext: RegistrationContext,
  ): TournamentEligibilityIssueDto[] {
    const issues: TournamentEligibilityIssueDto[] = [];
    const starters = team.rosterPlayers.filter(
      (player) => player.rosterType === RosterType.STARTER,
    );
    const substitutes = team.rosterPlayers.filter(
      (player) => player.rosterType === RosterType.SUBSTITUTE,
    );

    if (!captain.phoneNumber) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.CAPTAIN_PROFILE_INCOMPLETE,
        'profile.phoneNumber',
        'Captain profile must include a phone number before registration.',
      );
    }

    if (team.status !== TeamStatus.ACTIVE) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.TEAM_INACTIVE,
        'team.status',
        'Only active teams can register for tournaments.',
      );
    }

    if (tournament.visibility !== TournamentVisibility.PUBLIC) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.REGISTRATION_NOT_OPEN,
        'tournament.visibility',
        'This tournament is not publicly open for Captain registration.',
      );
    }

    if (tournament.status !== TournamentStatus.REGISTRATION_OPEN) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.REGISTRATION_NOT_OPEN,
        'tournament.status',
        'Tournament registration is not open.',
      );
    }

    if (
      tournament.cancelledAt ||
      tournament.status === TournamentStatus.CANCELLED ||
      tournament.status === TournamentStatus.ARCHIVED
    ) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.REGISTRATION_NOT_OPEN,
        'tournament.status',
        'Cancelled or archived tournaments are not open for registration.',
      );
    }

    if (now > tournament.registrationClosesAt) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.REGISTRATION_DEADLINE_PASSED,
        'tournament.registrationClosesAt',
        'The tournament registration deadline has passed.',
      );
    }

    if (
      now < tournament.registrationOpensAt &&
      tournament.status !== TournamentStatus.REGISTRATION_OPEN
    ) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.REGISTRATION_NOT_OPEN,
        'tournament.registrationOpensAt',
        'The tournament registration window has not opened yet.',
      );
    }

    if (
      registrationContext.activeRegistrationCount >= tournament.maximumTeams
    ) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.TOURNAMENT_FULL,
        'tournament.maximumTeams',
        'This tournament has reached its team capacity.',
      );
    }

    if (registrationContext.existingTeamRegistrationCount > 0) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.ALREADY_REGISTERED,
        'team',
        'This team is already registered for this tournament.',
      );
    }

    if (team.gameKey !== tournament.gameKey) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.GAME_MISMATCH,
        'team.gameKey',
        'Team game must match the tournament game.',
      );
    }

    if (starters.length < tournament.minimumStarters) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.INSUFFICIENT_STARTERS,
        'roster',
        `This tournament requires at least ${tournament.minimumStarters} starter players.`,
      );
    }

    if (starters.length > tournament.maximumStarters) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.TOO_MANY_STARTERS,
        'roster',
        `This tournament allows at most ${tournament.maximumStarters} starter players.`,
      );
    }

    if (substitutes.length > tournament.maximumSubstitutes) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.TOO_MANY_SUBSTITUTES,
        'roster',
        `This tournament allows at most ${tournament.maximumSubstitutes} substitute players.`,
      );
    }

    if (
      tournament.allowedRegion &&
      (!team.region || team.region !== tournament.allowedRegion)
    ) {
      this.addEligibilityIssue(
        issues,
        TournamentEligibilityIssueCode.REGION_NOT_ALLOWED,
        'team.region',
        `Team region must be ${tournament.allowedRegion}.`,
      );
    }

    for (const player of team.rosterPlayers) {
      if (tournament.requiredGameAccountId && !player.gameAccountId.trim()) {
        this.addEligibilityIssue(
          issues,
          TournamentEligibilityIssueCode.MISSING_GAME_ACCOUNT_ID,
          `roster.${player.id}.gameAccountId`,
          `${player.gamerTag} must have a game account ID.`,
        );
      }

      if (!player.phoneNumber.trim()) {
        this.addEligibilityIssue(
          issues,
          TournamentEligibilityIssueCode.MISSING_PLAYER_PHONE,
          `roster.${player.id}.phoneNumber`,
          `${player.gamerTag} must have a phone number.`,
        );
      }

      if (
        tournament.allowedCountries.length > 0 &&
        (!player.country ||
          !tournament.allowedCountries.includes(player.country))
      ) {
        this.addEligibilityIssue(
          issues,
          TournamentEligibilityIssueCode.COUNTRY_NOT_ALLOWED,
          `roster.${player.id}.country`,
          `${player.gamerTag} is not from an allowed country.`,
        );
      }

      if ((tournament.minimumRank || tournament.maximumRank) && !player.rank) {
        this.addEligibilityIssue(
          issues,
          TournamentEligibilityIssueCode.RANK_NOT_ALLOWED,
          `roster.${player.id}.rank`,
          `${player.gamerTag} must include a rank for this tournament.`,
        );
      }

      if (player.eligibilityStatus === EligibilityStatus.INELIGIBLE) {
        this.addEligibilityIssue(
          issues,
          TournamentEligibilityIssueCode.PLAYER_INELIGIBLE,
          `roster.${player.id}.eligibilityStatus`,
          `${player.gamerTag} is marked ineligible.`,
        );
      }
    }

    return issues;
  }

  private createRosterSnapshot(team: EligibilityTeam): Prisma.InputJsonValue {
    const snapshot: RosterSnapshotItem[] = team.rosterPlayers.map((player) => ({
      rosterPlayerId: player.id,
      gamerTag: player.gamerTag,
      realName: player.realName,
      gameAccountId: player.gameAccountId,
      phoneNumber: player.phoneNumber,
      email: player.email,
      discordUsername: player.discordUsername,
      rosterType: player.rosterType,
      rank: player.rank,
      country: player.country,
    }));

    return snapshot;
  }

  private createCaptainContactSnapshot(
    captain: EligibilityCaptain,
  ): Prisma.InputJsonObject {
    const snapshot: CaptainContactSnapshot = {
      displayName: captain.displayName,
      email: captain.email,
      phoneNumber: captain.phoneNumber,
      discordUsername: captain.discordUsername,
    };

    return snapshot;
  }

  private toTournamentRegistrationResponse(
    registration: RegistrationRecord,
  ): TournamentRegistrationResponseDto {
    return {
      id: registration.id,
      status: registration.status,
      paymentStatus: registration.paymentStatus,
      approvalStatus: registration.approvalStatus,
      rulesVersion: registration.rulesVersion,
      rulesAcceptedAt: registration.rulesAcceptedAt,
      submittedAt: registration.submittedAt,
      tournament: {
        id: registration.tournament.id,
        slug: registration.tournament.slug,
        name: registration.tournament.name,
        gameKey: registration.tournament.gameKey,
        mode: registration.tournament.mode,
        registrationFee: registration.tournament.registrationFee.toString(),
        currency: registration.tournament.currency,
        startsAt: registration.tournament.startsAt,
      },
      team: {
        id: registration.team.id,
        name: registration.team.name,
      },
    };
  }

  private addEligibilityIssue(
    issues: TournamentEligibilityIssueDto[],
    code: TournamentEligibilityIssueCode,
    field: string,
    message: string,
  ): void {
    issues.push({ code, field, message });
  }

  private isPrismaUniqueConstraintError(
    error: unknown,
  ): error is Prisma.PrismaClientKnownRequestError {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
