import { Module } from '@nestjs/common';
import { CaptainRegistrationsController } from './captain-registrations.controller';
import { CaptainTournamentEligibilityController } from './captain-tournament-eligibility.controller';
import { OrganizerTournamentsController } from './organizer-tournaments.controller';
import { PublicTournamentsController } from './public-tournaments.controller';
import { TournamentsService } from './tournaments.service';
import { TournamentCoverImageStorageService } from './tournament-cover-image-storage.service';
import { TournamentPaymentProofStorageService } from './tournament-payment-proof-storage.service';

@Module({
  controllers: [
    OrganizerTournamentsController,
    CaptainRegistrationsController,
    CaptainTournamentEligibilityController,
    PublicTournamentsController,
  ],
  providers: [
    TournamentsService,
    TournamentCoverImageStorageService,
    TournamentPaymentProofStorageService,
  ],
})
export class TournamentsModule {}
