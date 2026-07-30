import { type UserRole, type UserStatus } from '@clutcha/database';
import { type OrganizerProfileResponseDto } from '../dto/organizer-profile-response.dto';

export type OrganizerProfileRecord = Omit<
  OrganizerProfileResponseDto,
  'user'
> & {
  user: {
    id: string;
    email: string;
    displayName: string;
    role: UserRole;
    status: UserStatus;
  };
};

export const toOrganizerProfileResponse = (
  profile: OrganizerProfileRecord,
): OrganizerProfileResponseDto => ({
  id: profile.id,
  userId: profile.userId,
  organizationName: profile.organizationName,
  logoUrl: profile.logoUrl,
  coverUrl: profile.coverUrl,
  description: profile.description,
  contactEmail: profile.contactEmail,
  supportPhone: profile.supportPhone,
  country: profile.country,
  city: profile.city,
  websiteUrl: profile.websiteUrl,
  facebookUrl: profile.facebookUrl,
  instagramUrl: profile.instagramUrl,
  discordUrl: profile.discordUrl,
  createdAt: profile.createdAt,
  updatedAt: profile.updatedAt,
  user: {
    id: profile.user.id,
    email: profile.user.email,
    displayName: profile.user.displayName,
    role: profile.user.role,
    status: profile.user.status,
  },
});
