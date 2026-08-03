import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TeamStatus } from '@clutcha/database';

export class CaptainTeamResponseDto {
  @ApiProperty({ example: 'team-id' })
  id!: string;

  @ApiProperty({ example: 'Cairo Titans' })
  name!: string;

  @ApiProperty({ example: 'cairo-titans' })
  slug!: string;

  @ApiPropertyOptional({
    example: 'Competitive Valorant roster based in Cairo.',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ example: 'valorant' })
  gameKey!: string;

  @ApiPropertyOptional({ example: 'MENA', nullable: true })
  region!: string | null;

  @ApiPropertyOptional({
    example: 'https://cdn.clutcha.gg/teams/cairo-titans-logo.png',
    nullable: true,
  })
  logoUrl!: string | null;

  @ApiPropertyOptional({
    example: 'https://cdn.clutcha.gg/teams/cairo-titans-cover.png',
    nullable: true,
  })
  coverUrl!: string | null;

  @ApiPropertyOptional({
    example: 'https://discord.gg/cairo-titans',
    nullable: true,
    description:
      "Private Captain team Discord server URL. This is not the Captain's personal Discord username.",
  })
  discordServerUrl!: string | null;

  @ApiProperty({ enum: TeamStatus, example: TeamStatus.ACTIVE })
  status!: TeamStatus;

  @ApiProperty({
    example: 'captain-user-id',
    description: 'Always derived from the authenticated Captain JWT.',
  })
  captainId!: string;

  @ApiProperty({ example: '2026-08-03T12:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-08-03T12:00:00.000Z' })
  updatedAt!: Date;
}
