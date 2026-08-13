import { Injectable } from '@nestjs/common';
import { TournamentStatus, type Prisma } from '@clutcha/database';
import { DatabaseService } from '../../database/database.service';
import { type OrganizerDashboardResponseDto } from './dto/organizer-dashboard-response.dto';
import { type UpdateOrganizerProfileDto } from './dto/update-organizer-profile.dto';
import { toOrganizerProfileResponse } from './mappers/organizer.mapper';
import {
  OrganizerProfileImageStorageService,
  type OrganizerProfileImageFile,
  type OrganizerProfileImageKind,
} from './organizer-profile-image-storage.service';

type OrganizerProfileMutableData = Pick<
  Prisma.OrganizerProfileUncheckedCreateInput,
  | 'organizationName'
  | 'description'
  | 'contactEmail'
  | 'supportPhone'
  | 'country'
  | 'city'
  | 'websiteUrl'
  | 'facebookUrl'
  | 'instagramUrl'
  | 'discordUrl'
>;

const organizerProfileSelect = {
  id: true,
  userId: true,
  organizationName: true,
  logoUrl: true,
  coverUrl: true,
  description: true,
  contactEmail: true,
  supportPhone: true,
  country: true,
  city: true,
  websiteUrl: true,
  facebookUrl: true,
  instagramUrl: true,
  discordUrl: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      status: true,
    },
  },
} satisfies Prisma.OrganizerProfileSelect;

@Injectable()
export class OrganizersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly imageStorageService: OrganizerProfileImageStorageService,
  ) {}

  async getProfile(userId: string) {
    const profile = await this.databaseService.client.organizerProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: organizerProfileSelect,
    });

    return toOrganizerProfileResponse(profile);
  }

  async updateProfile(userId: string, dto: UpdateOrganizerProfileDto) {
    const profile = await this.databaseService.client.organizerProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...this.toUpdateData(dto),
      },
      update: this.toUpdateData(dto),
      select: organizerProfileSelect,
    });

    return toOrganizerProfileResponse(profile);
  }

  async uploadProfileImage(
    userId: string,
    kind: OrganizerProfileImageKind,
    file: OrganizerProfileImageFile | undefined,
    publicOrigin: string,
  ) {
    const imageUrl = await this.imageStorageService.saveProfileImage(
      userId,
      kind,
      file,
      publicOrigin,
    );
    const imageField = kind === 'logo' ? 'logoUrl' : 'coverUrl';

    const profile = await this.databaseService.client.organizerProfile.upsert({
      where: { userId },
      create: {
        userId,
        [imageField]: imageUrl,
      },
      update: {
        [imageField]: imageUrl,
      },
      select: organizerProfileSelect,
    });

    return toOrganizerProfileResponse(profile);
  }

  async getDashboard(userId: string): Promise<OrganizerDashboardResponseDto> {
    const tournament = this.databaseService.client.tournament;
    const baseWhere: Prisma.TournamentWhereInput = { organizerId: userId };
    const upcomingStatuses: TournamentStatus[] = [
      TournamentStatus.PUBLISHED,
      TournamentStatus.REGISTRATION_OPEN,
      TournamentStatus.REGISTRATION_CLOSED,
      TournamentStatus.CHECK_IN_OPEN,
      TournamentStatus.POSTPONED,
    ];
    const [
      totalTournaments,
      draftTournaments,
      publishedTournaments,
      registrationOpenTournaments,
      upcomingTournaments,
      liveTournaments,
      completedTournaments,
      cancelledTournaments,
      recentTournaments,
    ] = await this.databaseService.client.$transaction([
      tournament.count({ where: baseWhere }),
      tournament.count({
        where: { ...baseWhere, status: TournamentStatus.DRAFT },
      }),
      tournament.count({
        where: { ...baseWhere, status: TournamentStatus.PUBLISHED },
      }),
      tournament.count({
        where: { ...baseWhere, status: TournamentStatus.REGISTRATION_OPEN },
      }),
      tournament.count({
        where: {
          ...baseWhere,
          status: { in: upcomingStatuses },
          startsAt: { gt: new Date() },
        },
      }),
      tournament.count({
        where: { ...baseWhere, status: TournamentStatus.IN_PROGRESS },
      }),
      tournament.count({
        where: { ...baseWhere, status: TournamentStatus.COMPLETED },
      }),
      tournament.count({
        where: { ...baseWhere, status: TournamentStatus.CANCELLED },
      }),
      tournament.findMany({
        where: baseWhere,
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          slug: true,
          gameKey: true,
          mode: true,
          status: true,
          coverUrl: true,
          startsAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      summary: {
        totalTournaments,
        draftTournaments,
        publishedTournaments,
        registrationOpenTournaments,
        upcomingTournaments,
        liveTournaments,
        completedTournaments,
        cancelledTournaments,
      },
      recentTournaments,
    };
  }

  private toUpdateData(
    dto: UpdateOrganizerProfileDto,
  ): OrganizerProfileMutableData {
    return {
      organizationName: dto.organizationName,
      description: dto.description,
      contactEmail: dto.contactEmail,
      supportPhone: dto.supportPhone,
      country: dto.country,
      city: dto.city,
      websiteUrl: dto.websiteUrl,
      facebookUrl: dto.facebookUrl,
      instagramUrl: dto.instagramUrl,
      discordUrl: dto.discordUrl,
    };
  }
}
