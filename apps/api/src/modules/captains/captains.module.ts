import { Module } from '@nestjs/common';
import { CaptainsController } from './captains.controller';
import { CaptainsService } from './captains.service';

@Module({
  controllers: [CaptainsController],
  providers: [CaptainsService],
})
export class CaptainsModule {}
