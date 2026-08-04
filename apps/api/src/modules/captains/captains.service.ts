import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TeamStatus, UserRole } from '@clutcha/database';
import { DatabaseService } from '../../database/database.service';
import { type CreateCaptainTeamDto } from './dto/create-captain-team.dto';
import { type CreateRosterPlayerDto } from './dto/create-roster-player.dto';
import { type UpdateRosterPlayerDto } from './dto/update-roster-player.dto';
import { type UpdateCaptainTeamDto } from './dto/update-captain-team.dto';
import { type UpdateCaptainProfileDto } from './dto/update-captain-profile.dto';
import { toCaptainTeamResponse } from './mappers/captain-team.mapper';
import { toCaptainProfileResponse } from './mappers/captain-profile.mapper';
import {
  toRosterPlayerResponse,
  toRosterPlayerResponses,
} from './mappers/roster-player.mapper';

const captainProfileSelect = {
  id: true,
  email: true,
  displayName: true,
  phoneNumber: true,
  discordUsername: true,
  role: true,
  status: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

const captainTeamSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  gameKey: true,
  region: true,
  logoUrl: true,
  coverUrl: true,
  discordServerUrl: true,
  status: true,
  captainId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TeamSelect;

const rosterPlayerSelect = {
  id: true,
  gamerTag: true,
  realName: true,
  gameAccountId: true,
  phoneNumber: true,
  email: true,
  discordUsername: true,
  rank: true,
  country: true,
  rosterType: true,
  verificationStatus: true,
  eligibilityStatus: true,
  teamId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.RosterPlayerSelect;

type CaptainProfileMutableData = Pick<
  Prisma.UserUpdateInput,
  'displayName' | 'phoneNumber' | 'discordUsername'
>;

type CaptainTeamMutableData = Pick<
  Prisma.TeamUpdateInput,
  | 'name'
  | 'description'
  | 'gameKey'
  | 'region'
  | 'logoUrl'
  | 'coverUrl'
  | 'discordServerUrl'
>;

type TeamSlugTransaction = Pick<Prisma.TransactionClient, 'team'>;

type RosterPlayerMutableData = Pick<
  Prisma.RosterPlayerUpdateInput,
  | 'gamerTag'
  | 'realName'
  | 'gameAccountId'
  | 'phoneNumber'
  | 'email'
  | 'discordUsername'
  | 'rank'
  | 'country'
  | 'rosterType'
>;

type UniqueErrorMeta = {
  target?: unknown;
};

@Injectable()
export class CaptainsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getProfile(userId: string) {
    const captain = await this.findCaptainOrThrow(userId);

    return toCaptainProfileResponse(captain);
  }

  async getTeam(userId: string) {
    await this.findCaptainOrThrow(userId);

    const team = await this.databaseService.client.team.findUnique({
      where: { captainId: userId },
      select: captainTeamSelect,
    });

    if (!team) {
      throw new NotFoundException('Captain team was not found');
    }

    return toCaptainTeamResponse(team);
  }

  async createTeam(userId: string, dto: CreateCaptainTeamDto) {
    await this.findCaptainOrThrow(userId);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const team = await this.databaseService.client.$transaction(
          async (transaction) => {
            const existingTeam = await transaction.team.findUnique({
              where: { captainId: userId },
              select: { id: true },
            });

            if (existingTeam) {
              throw new ConflictException('Captain already owns a team');
            }

            const slug = await this.generateUniqueTeamSlug(
              dto.name,
              transaction,
            );

            return transaction.team.create({
              data: {
                name: dto.name,
                slug,
                description: dto.description,
                gameKey: dto.gameKey,
                region: dto.region,
                logoUrl: dto.logoUrl,
                coverUrl: dto.coverUrl,
                discordServerUrl: dto.discordServerUrl,
                status: TeamStatus.ACTIVE,
                captainId: userId,
              },
              select: captainTeamSelect,
            });
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );

        return toCaptainTeamResponse(team);
      } catch (error) {
        if (error instanceof ConflictException) {
          throw error;
        }

        if (this.isPrismaUniqueConstraintError(error)) {
          const target = this.getUniqueConstraintTarget(error);

          if (target.includes('captainId')) {
            throw new ConflictException('Captain already owns a team');
          }

          if (target.includes('slug')) {
            continue;
          }
        }

        if (this.isPrismaTransactionConflictError(error)) {
          throw new ConflictException('Captain already owns a team');
        }

        throw error;
      }
    }

    throw new ConflictException('Could not generate a unique team slug');
  }

  async updateTeam(userId: string, dto: UpdateCaptainTeamDto) {
    await this.findCaptainOrThrow(userId);

    const existingTeam = await this.databaseService.client.team.findUnique({
      where: { captainId: userId },
      select: {
        id: true,
        gameKey: true,
      },
    });

    if (!existingTeam) {
      throw new NotFoundException('Captain team was not found');
    }

    if (dto.gameKey && dto.gameKey !== existingTeam.gameKey) {
      this.assertTeamGameChangeIsAllowed();
    }

    const team = await this.databaseService.client.team.update({
      where: { captainId: userId },
      data: this.toTeamUpdateData(dto),
      select: captainTeamSelect,
    });

    return toCaptainTeamResponse(team);
  }

  async listRosterPlayers(userId: string) {
    const team = await this.findCaptainTeamOrThrow(userId);

    const players = await this.databaseService.client.rosterPlayer.findMany({
      where: { teamId: team.id },
      orderBy: [{ createdAt: 'asc' }, { gamerTag: 'asc' }],
      select: rosterPlayerSelect,
    });

    return toRosterPlayerResponses(players);
  }

  async createRosterPlayer(userId: string, dto: CreateRosterPlayerDto) {
    const team = await this.findCaptainTeamOrThrow(userId);

    try {
      const player = await this.databaseService.client.rosterPlayer.create({
        data: {
          gamerTag: dto.gamerTag,
          realName: dto.realName,
          gameAccountId: dto.gameAccountId,
          phoneNumber: dto.phoneNumber,
          email: dto.email,
          discordUsername: dto.discordUsername,
          rank: dto.rank,
          country: dto.country,
          rosterType: dto.rosterType,
          teamId: team.id,
        },
        select: rosterPlayerSelect,
      });

      return toRosterPlayerResponse(player);
    } catch (error) {
      this.throwRosterConflictIfNeeded(error);
      throw error;
    }
  }

  async getRosterPlayer(userId: string, playerId: string) {
    const team = await this.findCaptainTeamOrThrow(userId);
    const player = await this.findRosterPlayerOrThrow(team.id, playerId);

    return toRosterPlayerResponse(player);
  }

  async updateRosterPlayer(
    userId: string,
    playerId: string,
    dto: UpdateRosterPlayerDto,
  ) {
    const team = await this.findCaptainTeamOrThrow(userId);
    await this.findRosterPlayerOrThrow(team.id, playerId);

    try {
      const player = await this.databaseService.client.rosterPlayer.update({
        where: { id: playerId },
        data: this.toRosterPlayerUpdateData(dto),
        select: rosterPlayerSelect,
      });

      return toRosterPlayerResponse(player);
    } catch (error) {
      this.throwRosterConflictIfNeeded(error);
      throw error;
    }
  }

  async deleteRosterPlayer(userId: string, playerId: string) {
    const team = await this.findCaptainTeamOrThrow(userId);
    await this.findRosterPlayerOrThrow(team.id, playerId);

    const player = await this.databaseService.client.rosterPlayer.delete({
      where: { id: playerId },
      select: rosterPlayerSelect,
    });

    return toRosterPlayerResponse(player);
  }

  async updateProfile(userId: string, dto: UpdateCaptainProfileDto) {
    await this.findCaptainOrThrow(userId);

    const captain = await this.databaseService.client.user.update({
      where: { id: userId },
      data: this.toUpdateData(dto),
      select: captainProfileSelect,
    });

    return toCaptainProfileResponse(captain);
  }

  private async findCaptainOrThrow(userId: string) {
    const captain = await this.databaseService.client.user.findFirst({
      where: {
        id: userId,
        role: UserRole.CAPTAIN,
      },
      select: captainProfileSelect,
    });

    if (!captain) {
      throw new NotFoundException('Captain profile was not found');
    }

    return captain;
  }

  private async findCaptainTeamOrThrow(userId: string) {
    await this.findCaptainOrThrow(userId);

    const team = await this.databaseService.client.team.findUnique({
      where: { captainId: userId },
      select: { id: true },
    });

    if (!team) {
      throw new NotFoundException('Captain team was not found');
    }

    return team;
  }

  private async findRosterPlayerOrThrow(teamId: string, playerId: string) {
    const player = await this.databaseService.client.rosterPlayer.findFirst({
      where: {
        id: playerId,
        teamId,
      },
      select: rosterPlayerSelect,
    });

    if (!player) {
      throw new NotFoundException('Roster player was not found');
    }

    return player;
  }

  private toUpdateData(
    dto: UpdateCaptainProfileDto,
  ): CaptainProfileMutableData {
    return {
      displayName: dto.displayName,
      phoneNumber: dto.phoneNumber,
      discordUsername: dto.discordUsername,
    };
  }

  private toTeamUpdateData(dto: UpdateCaptainTeamDto): CaptainTeamMutableData {
    return {
      name: dto.name,
      description: dto.description,
      gameKey: dto.gameKey,
      region: dto.region,
      logoUrl: dto.logoUrl,
      coverUrl: dto.coverUrl,
      discordServerUrl: dto.discordServerUrl,
    };
  }

  private toRosterPlayerUpdateData(
    dto: UpdateRosterPlayerDto,
  ): RosterPlayerMutableData {
    return {
      gamerTag: dto.gamerTag,
      realName: dto.realName,
      gameAccountId: dto.gameAccountId,
      phoneNumber: dto.phoneNumber,
      email: dto.email,
      discordUsername: dto.discordUsername,
      rank: dto.rank,
      country: dto.country,
      rosterType: dto.rosterType,
    };
  }

  private assertTeamGameChangeIsAllowed(): void {
    /*
     * Tournament-registration records do not exist yet in this milestone.
     * Once registration persistence is introduced, this method should query
     * active registrations for the authenticated Captain's team and throw
     * ConflictException when changing gameKey would invalidate participation.
     */
  }

  private async generateUniqueTeamSlug(
    name: string,
    transaction: TeamSlugTransaction,
  ): Promise<string> {
    const baseSlug = this.slugify(name);

    for (let suffix = 0; suffix < 50; suffix += 1) {
      const slug = suffix === 0 ? baseSlug : `${baseSlug}-${suffix + 1}`;
      const existingTeam = await transaction.team.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!existingTeam) {
        return slug;
      }
    }

    return `${baseSlug}-${Date.now().toString(36)}`;
  }

  private slugify(value: string): string {
    const slug = value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)
      .replace(/-+$/g, '');

    return slug.length > 0 ? slug : 'team';
  }

  private isPrismaUniqueConstraintError(
    error: unknown,
  ): error is Prisma.PrismaClientKnownRequestError {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }

  private isPrismaTransactionConflictError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2034'
    );
  }

  private throwRosterConflictIfNeeded(error: unknown): void {
    if (!this.isPrismaUniqueConstraintError(error)) {
      return;
    }

    const target = this.getUniqueConstraintTarget(error);

    if (target.includes('teamId') && target.includes('gameAccountId')) {
      throw new ConflictException(
        'A roster player with this game account already exists on the team',
      );
    }
  }

  private getUniqueConstraintTarget(
    error: Prisma.PrismaClientKnownRequestError,
  ): string[] {
    const meta = error.meta as UniqueErrorMeta | undefined;
    const target = meta?.target;

    if (!Array.isArray(target)) {
      return [];
    }

    return target.filter((item): item is string => typeof item === 'string');
  }
}
