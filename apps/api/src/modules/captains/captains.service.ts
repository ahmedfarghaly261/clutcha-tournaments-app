import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TeamStatus, UserRole } from '@clutcha/database';
import { DatabaseService } from '../../database/database.service';
import { type CreateCaptainTeamDto } from './dto/create-captain-team.dto';
import { type UpdateCaptainProfileDto } from './dto/update-captain-profile.dto';
import { toCaptainTeamResponse } from './mappers/captain-team.mapper';
import { toCaptainProfileResponse } from './mappers/captain-profile.mapper';

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

type CaptainProfileMutableData = Pick<
  Prisma.UserUpdateInput,
  'displayName' | 'phoneNumber' | 'discordUsername'
>;

type TeamSlugTransaction = Pick<Prisma.TransactionClient, 'team'>;

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

  private toUpdateData(
    dto: UpdateCaptainProfileDto,
  ): CaptainProfileMutableData {
    return {
      displayName: dto.displayName,
      phoneNumber: dto.phoneNumber,
      discordUsername: dto.discordUsername,
    };
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
