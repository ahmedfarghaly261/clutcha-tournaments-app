import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const trimOptionalString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateOrganizerProfileDto {
  @ApiPropertyOptional({
    example: 'CLUTCHA Arena Cairo',
    description: 'Public organization or organizer name.',
    maxLength: 120,
  })
  @Transform(trimOptionalString)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  organizationName?: string;

  @ApiPropertyOptional({
    example: 'Competitive esports organizer focused on community tournaments.',
    description: 'Public organizer profile description.',
    maxLength: 2000,
  })
  @Transform(trimOptionalString)
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    example: 'support@example.com',
    description: 'Public contact email for organizer inquiries.',
    maxLength: 254,
  })
  @Transform(trimOptionalString)
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  contactEmail?: string;

  @ApiPropertyOptional({
    example: '+201001234567',
    description: 'Public support phone number.',
    maxLength: 40,
  })
  @Transform(trimOptionalString)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  supportPhone?: string;

  @ApiPropertyOptional({
    example: 'Egypt',
    description: 'Organizer country.',
    maxLength: 80,
  })
  @Transform(trimOptionalString)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;

  @ApiPropertyOptional({
    example: 'Cairo',
    description: 'Organizer city.',
    maxLength: 80,
  })
  @Transform(trimOptionalString)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @ApiPropertyOptional({
    example: 'https://example.com',
    description: 'Public website URL.',
    maxLength: 2048,
  })
  @Transform(trimOptionalString)
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  websiteUrl?: string;

  @ApiPropertyOptional({
    example: 'https://facebook.com/clutcha',
    description: 'Public Facebook URL.',
    maxLength: 2048,
  })
  @Transform(trimOptionalString)
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  facebookUrl?: string;

  @ApiPropertyOptional({
    example: 'https://instagram.com/clutcha',
    description: 'Public Instagram URL.',
    maxLength: 2048,
  })
  @Transform(trimOptionalString)
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  instagramUrl?: string;

  @ApiPropertyOptional({
    example: 'https://discord.gg/example',
    description: 'Public Discord URL.',
    maxLength: 2048,
  })
  @Transform(trimOptionalString)
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  discordUrl?: string;
}
