import { Module } from '@nestjs/common';
import { CaptainRegistrationsController } from './controllers/captain-registrations.controller';
import { CaptainTournamentEligibilityController } from './controllers/captain-tournament-eligibility.controller';
import { OrganizerTournamentsController } from './controllers/organizer-tournaments.controller';
import { PublicTournamentsController } from './controllers/public-tournaments.controller';
import { TournamentsService } from './services/tournaments.service';
import { TournamentCoverImageStorageService } from './services/tournament-cover-image-storage.service';
import { TournamentPaymentProofStorageService } from './services/tournament-payment-proof-storage.service';
import { TournamentPaymentService } from './services/tournament-payment.service';
import { TournamentConfigurationService } from './services/tournament-configuration.service';
import { TournamentBracketService } from './services/tournament-bracket.service';
import { TournamentEligibilityService } from './services/tournament-eligibility.service';
import { TournamentLifecycleService } from './services/tournament-lifecycle.service';
import { TournamentQueryService } from './services/tournament-query.service';

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
    TournamentPaymentService,
    TournamentConfigurationService,
    TournamentBracketService,
    TournamentEligibilityService,
    TournamentLifecycleService,
    TournamentQueryService,
  ],
})
export class TournamentsModule {}
