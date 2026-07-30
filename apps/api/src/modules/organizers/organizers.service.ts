import { Injectable } from '@nestjs/common';
import { type Prisma } from '@clutcha/database';
import { DatabaseService } from '../../database/database.service';
import { type UpdateOrganizerProfileDto } from './dto/update-organizer-profile.dto';
import { toOrganizerProfileResponse } from './mappers/organizer.mapper';

type OrganizerProfileMutableData = Pick<
  Prisma.OrganizerProfileUncheckedCreateInput,
  | 'organizationName'
  | 'logoUrl'
  | 'coverUrl'
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
  constructor(private readonly databaseService: DatabaseService) {}

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

  private toUpdateData(
    dto: UpdateOrganizerProfileDto,
  ): OrganizerProfileMutableData {
    return {
      organizationName: dto.organizationName,
      logoUrl: dto.logoUrl,
      coverUrl: dto.coverUrl,
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
