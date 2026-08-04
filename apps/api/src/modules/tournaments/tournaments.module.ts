import { Module } from '@nestjs/common';
import { CaptainTournamentEligibilityController } from './captain-tournament-eligibility.controller';
import { OrganizerTournamentsController } from './organizer-tournaments.controller';
import { PublicTournamentsController } from './public-tournaments.controller';
import { TournamentsService } from './tournaments.service';

@Module({
  controllers: [
    OrganizerTournamentsController,
    CaptainTournamentEligibilityController,
    PublicTournamentsController,
  ],
  providers: [TournamentsService],
})
export class TournamentsModule {}
