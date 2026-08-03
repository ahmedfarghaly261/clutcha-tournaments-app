import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const trimOptionalNullableString = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export class UpdateCaptainProfileDto {
  @ApiPropertyOptional({
    example: 'Ahmed Farghaly',
    minLength: 2,
    maxLength: 80,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @Length(2, 80)
  displayName?: string;

  @ApiPropertyOptional({
    example: '+201001234567',
    description:
      'Captain private phone number in E.164-style international format.',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message:
      'phoneNumber must be an E.164-style international phone number, for example +201001234567.',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'fegoo',
    nullable: true,
    maxLength: 80,
  })
  @Transform(trimOptionalNullableString)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  discordUsername?: string | null;
}
