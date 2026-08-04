import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EligibilityStatus,
  RosterType,
  VerificationStatus,
} from '@clutcha/database';

export class RosterPlayerResponseDto {
  @ApiProperty({ example: 'roster-player-id' })
  id!: string;

  @ApiProperty({ example: 'Fegoo' })
  gamerTag!: string;

  @ApiPropertyOptional({ example: 'Ahmed Farghaly', nullable: true })
  realName!: string | null;

  @ApiProperty({ example: 'VALORANT#1234' })
  gameAccountId!: string;

  @ApiProperty({ example: '+201001234567' })
  phoneNumber!: string;

  @ApiPropertyOptional({ example: 'player@example.com', nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ example: 'fegoo', nullable: true })
  discordUsername!: string | null;

  @ApiPropertyOptional({ example: 'Immortal 2', nullable: true })
  rank!: string | null;

  @ApiPropertyOptional({ example: 'EG', nullable: true })
  country!: string | null;

  @ApiProperty({ enum: RosterType, example: RosterType.STARTER })
  rosterType!: RosterType;

  @ApiProperty({
    enum: VerificationStatus,
    example: VerificationStatus.UNVERIFIED,
  })
  verificationStatus!: VerificationStatus;

  @ApiProperty({
    enum: EligibilityStatus,
    example: EligibilityStatus.PENDING_REVIEW,
  })
  eligibilityStatus!: EligibilityStatus;

  @ApiProperty({ example: 'team-id' })
  teamId!: string;

  @ApiProperty({ example: '2026-08-04T12:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-08-04T12:00:00.000Z' })
  updatedAt!: Date;
}
