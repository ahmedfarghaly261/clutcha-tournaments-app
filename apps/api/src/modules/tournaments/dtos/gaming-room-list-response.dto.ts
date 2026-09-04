import { ApiProperty } from '@nestjs/swagger';
import { GamingRoomResponseDto } from './gaming-room-response.dto';

export class GamingRoomListResponseDto {
  @ApiProperty({ type: [GamingRoomResponseDto] })
  items!: GamingRoomResponseDto[];
}
