import { PartialType } from '@nestjs/swagger';
import { CreateGamingRoomDto } from './create-gaming-room.dto';

export class UpdateGamingRoomDto extends PartialType(CreateGamingRoomDto) {}
