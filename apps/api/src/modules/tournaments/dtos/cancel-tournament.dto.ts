import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CancelTournamentDto {
  @ApiProperty({
    example: 'Venue became unavailable due to emergency maintenance.',
    minLength: 5,
    maxLength: 500,
  })
  @Transform(trimString)
  @IsString()
  @Length(5, 500)
  reason!: string;
}
