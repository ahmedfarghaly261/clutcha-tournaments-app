import { ApiProperty } from '@nestjs/swagger';

export class DatabaseHealthResponseDto {
  @ApiProperty({
    example: 'ok',
    description: 'Overall health status.',
  })
  status!: 'ok';

  @ApiProperty({
    example: 'connected',
    description: 'Current database connection status.',
  })
  database!: 'connected';
}
