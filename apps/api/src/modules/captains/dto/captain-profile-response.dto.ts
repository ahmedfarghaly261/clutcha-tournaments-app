import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@clutcha/database';

export class CaptainProfileResponseDto {
  @ApiProperty({ example: 'captain-user-id' })
  id!: string;

  @ApiProperty({ example: 'Ahmed Farghaly' })
  displayName!: string;

  @ApiProperty({ example: 'captain@example.com' })
  email!: string;

  @ApiPropertyOptional({ example: '+201001234567', nullable: true })
  phoneNumber!: string | null;

  @ApiPropertyOptional({ example: 'fegoo', nullable: true })
  discordUsername!: string | null;

  @ApiProperty({ enum: UserRole, example: UserRole.CAPTAIN })
  role!: UserRole;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status!: UserStatus;

  @ApiProperty({ example: true })
  profileComplete!: boolean;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: false,
    example: null,
    nullable: true,
    description:
      'Captain team summary. This remains null until Captain team ownership is implemented.',
  })
  team!: Record<string, never> | null;

  @ApiProperty({ example: '2026-08-03T12:00:00.000Z' })
  createdAt!: Date;
}
