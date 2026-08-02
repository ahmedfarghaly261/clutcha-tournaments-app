import { Module } from '@nestjs/common';
import { OrganizerTournamentsController } from './organizer-tournaments.controller';
import { TournamentsService } from './tournaments.service';

@Module({
  controllers: [OrganizerTournamentsController],
  providers: [TournamentsService],
})
export class TournamentsModule {}
