import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const normalizeOptionalString = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export class WithdrawCaptainRegistrationDto {
  @ApiPropertyOptional({
    example: 'The team is no longer available.',
    maxLength: 500,
    description:
      'Optional client-provided withdrawal reason. The current registration schema does not persist this value.',
  })
  @Transform(normalizeOptionalString)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
