import { UserRole, UserStatus } from '@clutcha/database';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrganizerProfileUserResponseDto {
  @ApiProperty({
    example: '5cc1e2fc-2efe-4dfb-a93e-8d2d2d818d86',
    description: 'Authenticated organizer user ID.',
  })
  id!: string;

  @ApiProperty({
    example: 'organizer@example.com',
    description: 'Organizer account email.',
  })
  email!: string;

  @ApiProperty({
    example: 'CLUTCHA Arena Cairo',
    description: 'Organizer account display name.',
  })
  displayName!: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.ORGANIZER,
    description: 'Authenticated account role.',
  })
  role!: UserRole;

  @ApiProperty({
    enum: UserStatus,
    example: UserStatus.ACTIVE,
    description: 'Authenticated account status.',
  })
  status!: UserStatus;
}

export class OrganizerProfileResponseDto {
  @ApiProperty({
    example: '7cb08a51-4896-43b5-90f5-0e3d183bcd1c',
    description: 'Organizer profile ID.',
  })
  id!: string;

  @ApiProperty({
    example: '5cc1e2fc-2efe-4dfb-a93e-8d2d2d818d86',
    description: 'User ID that owns this profile.',
  })
  userId!: string;

  @ApiPropertyOptional({
    example: 'CLUTCHA Arena Cairo',
    description: 'Public organization or organizer name.',
    nullable: true,
  })
  organizationName!: string | null;

  @ApiPropertyOptional({
    example:
      'http://localhost:3000/uploads/organizer-profiles/user-id/logo-image.png',
    description: 'Public stored organizer logo image URL.',
    nullable: true,
  })
  logoUrl!: string | null;

  @ApiPropertyOptional({
    example:
      'http://localhost:3000/uploads/organizer-profiles/user-id/cover-image.jpg',
    description: 'Public stored organizer cover image URL.',
    nullable: true,
  })
  coverUrl!: string | null;

  @ApiPropertyOptional({
    example: 'Competitive esports organizer focused on community tournaments.',
    description: 'Public organizer profile description.',
    nullable: true,
  })
  description!: string | null;

  @ApiPropertyOptional({
    example: 'support@example.com',
    description: 'Public contact email for organizer inquiries.',
    nullable: true,
  })
  contactEmail!: string | null;

  @ApiPropertyOptional({
    example: '+201001234567',
    description: 'Public support phone number.',
    nullable: true,
  })
  supportPhone!: string | null;

  @ApiPropertyOptional({
    example: 'Egypt',
    description: 'Organizer country.',
    nullable: true,
  })
  country!: string | null;

  @ApiPropertyOptional({
    example: 'Cairo',
    description: 'Organizer city.',
    nullable: true,
  })
  city!: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com',
    description: 'Public website URL.',
    nullable: true,
  })
  websiteUrl!: string | null;

  @ApiPropertyOptional({
    example: 'https://facebook.com/clutcha',
    description: 'Public Facebook URL.',
    nullable: true,
  })
  facebookUrl!: string | null;

  @ApiPropertyOptional({
    example: 'https://instagram.com/clutcha',
    description: 'Public Instagram URL.',
    nullable: true,
  })
  instagramUrl!: string | null;

  @ApiPropertyOptional({
    example: 'https://discord.gg/example',
    description: 'Public Discord URL.',
    nullable: true,
  })
  discordUrl!: string | null;

  @ApiProperty({
    example: '2026-07-30T11:26:09.000Z',
    description: 'Profile creation timestamp.',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-07-30T11:26:09.000Z',
    description: 'Profile update timestamp.',
  })
  updatedAt!: Date;

  @ApiProperty({
    type: OrganizerProfileUserResponseDto,
    description: 'Safe authenticated organizer account information.',
  })
  user!: OrganizerProfileUserResponseDto;
}
