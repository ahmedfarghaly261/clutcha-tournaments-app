import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  Prisma,
  TournamentMatchStatus,
  TournamentMode,
  TournamentStatus,
} from '@clutcha/database';
import { DatabaseService } from '../../../database/database.service';
import { type OrganizerBracketMatchDto } from '../dtos/organizer-bracket-response.dto';
import { type ScheduleOrganizerMatchDto } from '../dtos/schedule-organizer-match.dto';

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

@Injectable()
export class TournamentMatchService {
  constructor(private readonly databaseService: DatabaseService) {}

  async scheduleOrganizerTournamentMatch(
    organizerId: string,
    tournamentId: string,
    matchId: string,
    dto: ScheduleOrganizerMatchDto,
  ): Promise<OrganizerBracketMatchDto> {
    const match = await this.databaseService.client.$transaction(
      async (transaction) => {
        const tournament = await this.findOwnedTournamentOrThrow(
          transaction,
          organizerId,
          tournamentId,
        );
        this.assertTournamentCanScheduleMatches(tournament.status);

        const existing = await transaction.tournamentMatch.findFirst({
          where: {
            id: matchId,
            tournamentId,
          },
          select: organizerBracketMatchSelect,
        });

        if (!existing) {
          throw new NotFoundException('Tournament match was not found.');
        }

        this.assertMatchCanBeScheduled(existing.status);
        const scheduledAt = new Date(dto.scheduledAt);
        this.assertMatchScheduleWithinTournament(tournament, scheduledAt);

        const assignment =
          tournament.mode === TournamentMode.ONLINE
            ? this.toOnlineMatchAssignment(dto)
            : await this.toOnsiteMatchAssignment(
                transaction,
                tournamentId,
                dto,
              );

        return transaction.tournamentMatch.update({
          where: { id: existing.id },
          data: {
            scheduledAt,
            status: TournamentMatchStatus.SCHEDULED,
            ...assignment,
          },
          select: organizerBracketMatchSelect,
        });
      },
    );

    return this.toOrganizerBracketMatch(match);
  }

  private async findOwnedTournamentOrThrow(
    transaction: Pick<Prisma.TransactionClient, 'tournament'>,
    organizerId: string,
    tournamentId: string,
  ): Promise<{
    status: TournamentStatus;
    startsAt: Date;
    endsAt: Date | null;
    mode: TournamentMode;
  }> {
    const tournament = await transaction.tournament.findFirst({
      where: {
        id: tournamentId,
        organizerId,
      },
      select: {
        status: true,
        startsAt: true,
        endsAt: true,
        mode: true,
      },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament was not found');
    }

    return tournament;
  }

  private assertTournamentCanScheduleMatches(status: TournamentStatus): void {
    const allowedStatuses: readonly TournamentStatus[] = [
      TournamentStatus.REGISTRATION_CLOSED,
      TournamentStatus.CHECK_IN_OPEN,
      TournamentStatus.IN_PROGRESS,
      TournamentStatus.POSTPONED,
    ];

    if (!allowedStatuses.includes(status)) {
      throw new ConflictException(
        'Matches can only be scheduled after registration closes and before the tournament reaches a terminal status.',
      );
    }
  }

  private assertMatchCanBeScheduled(status: TournamentMatchStatus): void {
    if (
      status !== TournamentMatchStatus.SCHEDULED &&
      status !== TournamentMatchStatus.POSTPONED
    ) {
      throw new ConflictException(
        'Live, completed, cancelled, or forfeited matches cannot be rescheduled.',
      );
    }
  }

  private assertMatchScheduleWithinTournament(
    tournament: {
      startsAt: Date;
      endsAt: Date | null;
    },
    scheduledAt: Date,
  ): void {
    if (scheduledAt < tournament.startsAt) {
      throw new UnprocessableEntityException(
        'Match time cannot be earlier than the tournament start time.',
      );
    }

    if (tournament.endsAt && scheduledAt > tournament.endsAt) {
      throw new UnprocessableEntityException(
        'Match time cannot be later than the tournament end time.',
      );
    }
  }

  private toOnlineMatchAssignment(dto: ScheduleOrganizerMatchDto): {
    onlineServerInfo: Prisma.InputJsonObject;
    gamingRoomId: null;
    onsiteStationLabel: null;
  } {
    if (!dto.onlineServerInfo) {
      throw new UnprocessableEntityException(
        'onlineServerInfo is required for online tournament matches.',
      );
    }

    if (
      !dto.onlineServerInfo.serverRegion.trim() ||
      !dto.onlineServerInfo.lobbyName.trim()
    ) {
      throw new UnprocessableEntityException(
        'serverRegion and lobbyName are required for online tournament matches.',
      );
    }

    if (dto.gamingRoomId || dto.onsiteStationLabel) {
      throw new UnprocessableEntityException(
        'gamingRoomId and onsiteStationLabel are only valid for on-site tournament matches.',
      );
    }

    const onlineServerInfo: Prisma.InputJsonObject = {
      serverRegion: dto.onlineServerInfo.serverRegion.trim(),
      lobbyName: dto.onlineServerInfo.lobbyName.trim(),
      ...(dto.onlineServerInfo.lobbyCode
        ? { lobbyCode: dto.onlineServerInfo.lobbyCode.trim() }
        : {}),
      ...(dto.onlineServerInfo.lobbyPassword
        ? { lobbyPassword: dto.onlineServerInfo.lobbyPassword.trim() }
        : {}),
      ...(dto.onlineServerInfo.notes
        ? { notes: dto.onlineServerInfo.notes.trim() }
        : {}),
    };

    return {
      onlineServerInfo,
      gamingRoomId: null,
      onsiteStationLabel: null,
    };
  }

  private async toOnsiteMatchAssignment(
    transaction: Pick<Prisma.TransactionClient, 'tournamentGamingRoom'>,
    tournamentId: string,
    dto: ScheduleOrganizerMatchDto,
  ): Promise<{
    onlineServerInfo: typeof Prisma.DbNull;
    gamingRoomId: string;
    onsiteStationLabel: string;
  }> {
    if (dto.onlineServerInfo) {
      throw new UnprocessableEntityException(
        'onlineServerInfo is only valid for online tournament matches.',
      );
    }

    if (!dto.gamingRoomId || !dto.onsiteStationLabel?.trim()) {
      throw new UnprocessableEntityException(
        'gamingRoomId and onsiteStationLabel are required for on-site tournament matches.',
      );
    }

    const gamingRoom = await transaction.tournamentGamingRoom.findFirst({
      where: {
        id: dto.gamingRoomId,
        venue: {
          tournamentId,
        },
      },
      select: { id: true },
    });
    if (!gamingRoom) {
      throw new NotFoundException(
        'Gaming room was not found for this tournament.',
      );
    }

    return {
      onlineServerInfo: Prisma.DbNull,
      gamingRoomId: gamingRoom.id,
      onsiteStationLabel: dto.onsiteStationLabel.trim(),
    };
  }

  private toOrganizerBracketMatch(
    match: Prisma.TournamentMatchGetPayload<{
      select: typeof organizerBracketMatchSelect;
    }>,
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
}
