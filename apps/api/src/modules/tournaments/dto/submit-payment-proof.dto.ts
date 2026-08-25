import { Transform } from 'class-transformer';
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const trimOptionalStringToNull = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export class SubmitPaymentProofDto {
  @ApiProperty()
  @IsUUID()
  paymentMethodId!: string;

  @ApiPropertyOptional({ nullable: true, maxLength: 160 })
  @Transform(trimOptionalStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(160)
  transactionReference?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Transform(trimOptionalStringToNull)
  @IsOptional()
  @IsDateString()
  paidAt?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 1000 })
  @Transform(trimOptionalStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  captainNote?: string | null;
}
