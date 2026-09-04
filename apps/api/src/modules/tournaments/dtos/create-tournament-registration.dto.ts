import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateTournamentRegistrationDto {
  @ApiProperty({
    example: true,
    description:
      'Must be true. The Captain accepts the tournament rules version stored by the server.',
  })
  @IsBoolean()
  @IsNotEmpty()
  acceptRules!: boolean;
}
