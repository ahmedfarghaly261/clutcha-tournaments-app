import { ApiProperty } from '@nestjs/swagger';
import { CurrentUserResponseDto } from './current-user-response.dto';

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.signature',
    description: 'Short-lived JWT access token.',
  })
  accessToken!: string;

  @ApiProperty({
    example: 900,
    description: 'Access token lifetime in seconds.',
  })
  accessTokenExpiresIn!: number;

  @ApiProperty({ type: CurrentUserResponseDto })
  user!: CurrentUserResponseDto;
}
