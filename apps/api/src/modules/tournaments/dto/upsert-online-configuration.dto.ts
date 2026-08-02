import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class UpsertOnlineConfigurationDto {
  @ApiProperty({
    example: 'EU West',
    minLength: 2,
    maxLength: 100,
    description: 'Public server region shown to registered teams.',
  })
  @Transform(trimString)
  @IsString()
  @Length(2, 100)
  serverRegion!: string;

  @ApiPropertyOptional({
    example: 'Captains join the lobby 15 minutes before match time.',
    maxLength: 3000,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  publicInstructions?: string;

  @ApiPropertyOptional({
    example: 'Use the assigned lobby, no remakes after round three.',
    maxLength: 3000,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  connectionRules?: string;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  evidenceRequired?: boolean;

  @ApiPropertyOptional({
    example: 'Upload final scoreboard and match history screenshots.',
    maxLength: 3000,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  screenshotRequirements?: string;

  @ApiPropertyOptional({ example: 30, minimum: 1, maximum: 10080 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10080)
  resultSubmissionDeadlineMinutes?: number;

  @ApiPropertyOptional({
    example: 'https://discord.gg/clutcha',
    description: 'Private organizer Discord server invite.',
  })
  @Transform(trimString)
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  discordServerUrl?: string;

  @ApiPropertyOptional({
    example: '#captain-support',
    maxLength: 100,
    description: 'Private channel for captain support.',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  captainSupportChannel?: string;

  @ApiPropertyOptional({
    example: '#match-reporting',
    maxLength: 100,
    description: 'Private channel for match reporting.',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  matchReportingChannel?: string;

  @ApiPropertyOptional({
    example: 'Lobby credentials are shared with captains after check-in.',
    maxLength: 3000,
    description: 'Private lobby instructions for organizers/staff.',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  lobbyInstructions?: string;

  @ApiPropertyOptional({
    example: '+20 100 000 0000',
    maxLength: 200,
    description: 'Private support contact.',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  privateSupportContact?: string;
}
