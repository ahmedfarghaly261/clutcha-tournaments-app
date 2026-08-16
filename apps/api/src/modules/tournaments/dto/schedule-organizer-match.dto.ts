import { Type } from 'class-transformer';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrganizerMatchOnlineServerInfoDto {
  @ApiProperty({ example: 'MENA' })
  @IsString()
  @MaxLength(100)
  serverRegion!: string;

  @ApiProperty({ example: 'CLUTCHA-CUP-R1-M1' })
  @IsString()
  @MaxLength(120)
  lobbyName!: string;

  @ApiPropertyOptional({ example: 'CUP-R1M1' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lobbyCode?: string;

  @ApiPropertyOptional({ example: 'private-password' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lobbyPassword?: string;

  @ApiPropertyOptional({
    example: 'Join 15 minutes before the scheduled time.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class ScheduleOrganizerMatchDto {
  @ApiProperty({ example: '2026-09-12T18:00:00.000Z' })
  @IsDateString({ strict: true })
  scheduledAt!: string;

  @ApiPropertyOptional({ type: OrganizerMatchOnlineServerInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrganizerMatchOnlineServerInfoDto)
  onlineServerInfo?: OrganizerMatchOnlineServerInfoDto;

  @ApiPropertyOptional({ example: '2df149ea-a859-4553-a87a-c6cf5bbdb5b8' })
  @IsOptional()
  @IsUUID('4')
  gamingRoomId?: string;

  @ApiPropertyOptional({ example: 'Station A-04' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  onsiteStationLabel?: string;
}
