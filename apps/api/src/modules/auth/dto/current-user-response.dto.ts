import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@clutcha/database';

export class CurrentUserResponseDto {
  @ApiProperty({ example: 'c4f73927-d6ef-4d2f-8617-c8f453d19f2f' })
  id!: string;

  @ApiProperty({ example: 'captain@example.com' })
  email!: string;

  @ApiProperty({ example: 'Ahmed Farghaly' })
  displayName!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CAPTAIN })
  role!: UserRole;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status!: UserStatus;

  @ApiProperty({
    example: '2026-07-30T12:00:00.000Z',
    nullable: true,
  })
  emailVerifiedAt!: Date | null;

  @ApiProperty({ example: '2026-07-30T12:00:00.000Z' })
  createdAt!: Date;
}
