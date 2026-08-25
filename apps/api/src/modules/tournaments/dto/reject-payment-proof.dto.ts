import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class RejectPaymentProofDto {
  @ApiProperty({
    example: 'Payment was not received in the organizer account.',
    minLength: 3,
    maxLength: 500,
  })
  @Transform(trimString)
  @IsString()
  @Length(3, 500)
  reason!: string;
}
