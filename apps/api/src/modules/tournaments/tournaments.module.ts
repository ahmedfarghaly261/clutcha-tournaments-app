import { Module } from '@nestjs/common';
import { OrganizerTournamentsController } from './organizer-tournaments.controller';
import { PublicTournamentsController } from './public-tournaments.controller';
import { TournamentsService } from './tournaments.service';

@Module({
  controllers: [OrganizerTournamentsController, PublicTournamentsController],
  providers: [TournamentsService],
})
export class TournamentsModule {}
