import { Injectable } from '@nestjs/common';
import { type OrganizerTournamentDetailResponseDto } from '../dtos/organizer-tournament-detail-response.dto';
import { type CreateGamingRoomDto } from '../dtos/create-gaming-room.dto';
import { type CreateTournamentDto } from '../dtos/create-tournament.dto';
import { type GenerateOrganizerBracketDto } from '../dtos/generate-organizer-bracket.dto';
import { type CreateTournamentRegistrationDto } from '../dtos/create-tournament-registration.dto';
import { type ListOrganizerTournamentsQueryDto } from '../dtos/list-organizer-tournaments-query.dto';
import { type ListCaptainRegistrationsQueryDto } from '../dtos/list-captain-registrations-query.dto';
import { type ListPublicTournamentsQueryDto } from '../dtos/list-public-tournaments-query.dto';
import {
  type CaptainRegistrationDetailResponseDto,
  type CaptainRegistrationListResponseDto,
} from '../dtos/captain-registration-response.dto';
import { type CaptainRegistrationBracketResponseDto } from '../dtos/captain-registration-bracket-response.dto';
import { type CaptainRegistrationCheckInResponseDto } from '../dtos/captain-registration-check-in-response.dto';
import { type CaptainRegistrationHubResponseDto } from '../dtos/captain-registration-hub-response.dto';
import { type CaptainRegistrationInformationResponseDto } from '../dtos/captain-registration-information-response.dto';
import {
  type CaptainMatchListResponseDto,
  type CaptainMatchResponseDto,
} from '../dtos/captain-registration-match-response.dto';
import { type CaptainRegistrationProgressResponseDto } from '../dtos/captain-registration-progress-response.dto';
import { type CaptainRegistrationStandingsResponseDto } from '../dtos/captain-registration-standings-response.dto';
import { type CancelTournamentDto } from '../dtos/cancel-tournament.dto';
import { type OnlineConfigurationResponseDto } from '../dtos/online-configuration-response.dto';
import {
  type OrganizerBracketMatchDto,
  type OrganizerBracketResponseDto,
} from '../dtos/organizer-bracket-response.dto';
import {
  type OrganizerRegistrationDetailResponseDto,
  type OrganizerRegistrationListResponseDto,
} from '../dtos/organizer-registration-response.dto';
import { type OrganizerTournamentListResponseDto } from '../dtos/organizer-tournament-list-response.dto';
import { type PublicTournamentDetailResponseDto } from '../dtos/public-tournament-detail-response.dto';
import { type PublicTournamentListResponseDto } from '../dtos/public-tournament-list-response.dto';
import { type RejectOrganizerRegistrationDto } from '../dtos/reject-organizer-registration.dto';
import { type RejectPaymentProofDto } from '../dtos/reject-payment-proof.dto';
import { type ScheduleOrganizerMatchDto } from '../dtos/schedule-organizer-match.dto';
import { type SubmitPaymentProofDto } from '../dtos/submit-payment-proof.dto';
import { type TournamentEligibilityResponseDto } from '../dtos/tournament-eligibility-response.dto';
import { type TournamentRegistrationResponseDto } from '../dtos/tournament-registration-response.dto';
import { type TournamentResponseDto } from '../dtos/tournament-response.dto';
import { type UpdateGamingRoomDto } from '../dtos/update-gaming-room.dto';
import { type UpdateTournamentDraftDto } from '../dtos/update-tournament-draft.dto';
import { type UpsertOnlineConfigurationDto } from '../dtos/upsert-online-configuration.dto';
import { type UpsertTournamentPaymentMethodDto } from '../dtos/upsert-tournament-payment-method.dto';
import { type UpsertVenueDto } from '../dtos/upsert-venue.dto';
import { type VenueResponseDto } from '../dtos/venue-response.dto';
import { type WithdrawCaptainRegistrationDto } from '../dtos/withdraw-captain-registration.dto';
import { type TournamentCoverImageFile } from './tournament-cover-image-storage.service';
import { type TournamentPaymentProofFile } from './tournament-payment-proof-storage.service';
import { TournamentConfigurationService } from './tournament-configuration.service';
import { TournamentBracketService } from './tournament-bracket.service';
import { TournamentEligibilityService } from './tournament-eligibility.service';
import { TournamentLifecycleService } from './tournament-lifecycle.service';
import { TournamentPaymentService } from './tournament-payment.service';
import { TournamentQueryService } from './tournament-query.service';
import { TournamentMatchService } from './tournament-match.service';
import { TournamentCaptainMatchService } from './tournament-captain-match.service';
import { TournamentGamingRoomService } from './tournament-gaming-room.service';
import { TournamentRegistrationService } from './tournament-registration.service';
import { TournamentManagementService } from './tournament-management.service';

@Injectable()
export class TournamentsService {
  constructor(
    private readonly tournamentQueryService: TournamentQueryService,
    private readonly tournamentConfigurationService: TournamentConfigurationService,
    private readonly tournamentBracketService: TournamentBracketService,
    private readonly tournamentEligibilityService: TournamentEligibilityService,
    private readonly tournamentRegistrationService: TournamentRegistrationService,
    private readonly tournamentLifecycleService: TournamentLifecycleService,
    private readonly tournamentPaymentService: TournamentPaymentService,
    private readonly tournamentMatchService: TournamentMatchService,
    private readonly tournamentCaptainMatchService: TournamentCaptainMatchService,
    private readonly tournamentGamingRoomService: TournamentGamingRoomService,
    private readonly tournamentManagementService: TournamentManagementService,
  ) {}

  async listPublicTournaments(
    query: ListPublicTournamentsQueryDto,
  ): Promise<PublicTournamentListResponseDto> {
    return this.tournamentQueryService.listPublicTournaments(query);
  }

  async getPublicTournamentDetails(
    slug: string,
  ): Promise<PublicTournamentDetailResponseDto> {
    return this.tournamentQueryService.getPublicTournamentDetails(slug);
  }

  async getCaptainTournamentEligibility(
    captainId: string,
    tournamentId: string,
  ): Promise<TournamentEligibilityResponseDto> {
    return this.tournamentEligibilityService.getCaptainTournamentEligibility(
      captainId,
      tournamentId,
    );
  }

  async createCaptainTournamentRegistration(
    captainId: string,
    tournamentId: string,
    dto: CreateTournamentRegistrationDto,
  ): Promise<TournamentRegistrationResponseDto> {
    return this.tournamentEligibilityService.createCaptainTournamentRegistration(
      captainId,
      tournamentId,
      dto,
    );
  }

  async listCaptainRegistrations(
    captainId: string,
    query: ListCaptainRegistrationsQueryDto,
  ): Promise<CaptainRegistrationListResponseDto> {
    return this.tournamentRegistrationService.listCaptainRegistrations(
      captainId,
      query,
    );
  }

  async getCaptainRegistrationDetails(
    captainId: string,
    registrationId: string,
  ): Promise<CaptainRegistrationDetailResponseDto> {
    return this.tournamentRegistrationService.getCaptainRegistrationDetails(
      captainId,
      registrationId,
    );
  }

  async getCaptainRegistrationHub(
    captainId: string,
    registrationId: string,
  ): Promise<CaptainRegistrationHubResponseDto> {
    return this.tournamentRegistrationService.getCaptainRegistrationHub(
      captainId,
      registrationId,
    );
  }

  async listCaptainRegistrationMatches(
    captainId: string,
    registrationId: string,
  ): Promise<CaptainMatchListResponseDto> {
    return this.tournamentCaptainMatchService.listCaptainRegistrationMatches(
      captainId,
      registrationId,
    );
  }

  async getCaptainRegistrationMatch(
    captainId: string,
    registrationId: string,
    matchId: string,
  ): Promise<CaptainMatchResponseDto> {
    return this.tournamentCaptainMatchService.getCaptainRegistrationMatch(
      captainId,
      registrationId,
      matchId,
    );
  }

  async getCaptainRegistrationProgress(
    captainId: string,
    registrationId: string,
  ): Promise<CaptainRegistrationProgressResponseDto> {
    return this.tournamentCaptainMatchService.getCaptainRegistrationProgress(
      captainId,
      registrationId,
    );
  }

  async getCaptainRegistrationBracket(
    captainId: string,
    registrationId: string,
  ): Promise<CaptainRegistrationBracketResponseDto> {
    return this.tournamentCaptainMatchService.getCaptainRegistrationBracket(
      captainId,
      registrationId,
    );
  }

  async getCaptainRegistrationStandings(
    captainId: string,
    registrationId: string,
  ): Promise<CaptainRegistrationStandingsResponseDto> {
    return this.tournamentCaptainMatchService.getCaptainRegistrationStandings(
      captainId,
      registrationId,
    );
  }

  async getCaptainRegistrationInformation(
    captainId: string,
    registrationId: string,
  ): Promise<CaptainRegistrationInformationResponseDto> {
    return this.tournamentCaptainMatchService.getCaptainRegistrationInformation(
      captainId,
      registrationId,
    );
  }

  async getCaptainRegistrationCheckIn(
    captainId: string,
    registrationId: string,
  ): Promise<CaptainRegistrationCheckInResponseDto> {
    return this.tournamentRegistrationService.getCaptainRegistrationCheckIn(
      captainId,
      registrationId,
    );
  }

  async checkInCaptainRegistration(
    captainId: string,
    registrationId: string,
  ): Promise<CaptainRegistrationCheckInResponseDto> {
    return this.tournamentRegistrationService.checkInCaptainRegistration(
      captainId,
      registrationId,
    );
  }

  async withdrawCaptainRegistration(
    captainId: string,
    registrationId: string,
    dto: WithdrawCaptainRegistrationDto,
  ): Promise<CaptainRegistrationDetailResponseDto> {
    return this.tournamentRegistrationService.withdrawCaptainRegistration(
      captainId,
      registrationId,
      dto,
    );
  }

  async listOrganizerTournamentRegistrations(
    organizerId: string,
    tournamentId: string,
  ): Promise<OrganizerRegistrationListResponseDto> {
    return this.tournamentRegistrationService.listOrganizerTournamentRegistrations(
      organizerId,
      tournamentId,
    );
  }

  async getOrganizerTournamentBracket(
    organizerId: string,
    tournamentId: string,
  ): Promise<OrganizerBracketResponseDto> {
    return this.tournamentBracketService.getOrganizerTournamentBracket(
      organizerId,
      tournamentId,
    );
  }

  async generateOrganizerTournamentBracket(
    organizerId: string,
    tournamentId: string,
    dto: GenerateOrganizerBracketDto,
  ): Promise<OrganizerBracketResponseDto> {
    return this.tournamentBracketService.generateOrganizerTournamentBracket(
      organizerId,
      tournamentId,
      dto,
    );
  }

  async scheduleOrganizerTournamentMatch(
    organizerId: string,
    tournamentId: string,
    matchId: string,
    dto: ScheduleOrganizerMatchDto,
  ): Promise<OrganizerBracketMatchDto> {
    return this.tournamentMatchService.scheduleOrganizerTournamentMatch(
      organizerId,
      tournamentId,
      matchId,
      dto,
    );
  }

  async getOrganizerTournamentRegistration(
    organizerId: string,
    tournamentId: string,
    registrationId: string,
  ): Promise<OrganizerRegistrationDetailResponseDto> {
    return this.tournamentRegistrationService.getOrganizerTournamentRegistration(
      organizerId,
      tournamentId,
      registrationId,
    );
  }

  async approveOrganizerTournamentRegistration(
    organizerId: string,
    tournamentId: string,
    registrationId: string,
  ): Promise<OrganizerRegistrationDetailResponseDto> {
    return this.tournamentRegistrationService.approveOrganizerTournamentRegistration(
      organizerId,
      tournamentId,
      registrationId,
    );
  }

  async rejectOrganizerTournamentRegistration(
    organizerId: string,
    tournamentId: string,
    registrationId: string,
    dto: RejectOrganizerRegistrationDto,
  ): Promise<OrganizerRegistrationDetailResponseDto> {
    return this.tournamentRegistrationService.rejectOrganizerTournamentRegistration(
      organizerId,
      tournamentId,
      registrationId,
      dto,
    );
  }

  async listOrganizerTournamentPaymentMethods(
    organizerId: string,
    tournamentId: string,
  ) {
    return this.tournamentPaymentService.listOrganizerTournamentPaymentMethods(
      organizerId,
      tournamentId,
    );
  }

  async listCaptainTournamentPaymentMethods(tournamentId: string) {
    return this.tournamentPaymentService.listCaptainTournamentPaymentMethods(
      tournamentId,
    );
  }

  async createOrganizerTournamentPaymentMethod(
    organizerId: string,
    tournamentId: string,
    dto: UpsertTournamentPaymentMethodDto,
  ) {
    return this.tournamentPaymentService.createOrganizerTournamentPaymentMethod(
      organizerId,
      tournamentId,
      dto,
    );
  }

  async updateOrganizerTournamentPaymentMethod(
    organizerId: string,
    tournamentId: string,
    paymentMethodId: string,
    dto: UpsertTournamentPaymentMethodDto,
  ) {
    return this.tournamentPaymentService.updateOrganizerTournamentPaymentMethod(
      organizerId,
      tournamentId,
      paymentMethodId,
      dto,
    );
  }

  async deleteOrganizerTournamentPaymentMethod(
    organizerId: string,
    tournamentId: string,
    paymentMethodId: string,
  ) {
    return this.tournamentPaymentService.deleteOrganizerTournamentPaymentMethod(
      organizerId,
      tournamentId,
      paymentMethodId,
    );
  }

  async submitCaptainRegistrationPaymentProof(
    captainId: string,
    registrationId: string,
    dto: SubmitPaymentProofDto,
    file: TournamentPaymentProofFile | undefined,
    publicOrigin: string,
  ) {
    return this.tournamentPaymentService.submitCaptainRegistrationPaymentProof(
      captainId,
      registrationId,
      dto,
      file,
      publicOrigin,
    );
  }

  async verifyOrganizerRegistrationPaymentProof(
    organizerId: string,
    tournamentId: string,
    registrationId: string,
  ) {
    return this.tournamentPaymentService.verifyOrganizerRegistrationPaymentProof(
      organizerId,
      tournamentId,
      registrationId,
    );
  }

  async rejectOrganizerRegistrationPaymentProof(
    organizerId: string,
    tournamentId: string,
    registrationId: string,
    dto: RejectPaymentProofDto,
  ) {
    return this.tournamentPaymentService.rejectOrganizerRegistrationPaymentProof(
      organizerId,
      tournamentId,
      registrationId,
      dto,
    );
  }

  async openOrganizerTournamentRegistration(
    organizerId: string,
    tournamentId: string,
  ): Promise<TournamentResponseDto> {
    return this.tournamentLifecycleService.openRegistration(
      organizerId,
      tournamentId,
    );
  }

  async closeOrganizerTournamentRegistration(
    organizerId: string,
    tournamentId: string,
  ): Promise<TournamentResponseDto> {
    return this.tournamentLifecycleService.closeRegistration(
      organizerId,
      tournamentId,
    );
  }

  async openOrganizerTournamentCheckIn(
    organizerId: string,
    tournamentId: string,
  ): Promise<TournamentResponseDto> {
    return this.tournamentLifecycleService.openCheckIn(
      organizerId,
      tournamentId,
    );
  }

  async cancelOrganizerTournament(
    organizerId: string,
    tournamentId: string,
    dto: CancelTournamentDto,
  ): Promise<TournamentResponseDto> {
    return this.tournamentLifecycleService.cancel(
      organizerId,
      tournamentId,
      dto.reason,
    );
  }

  async listGamingRooms(organizerId: string, tournamentId: string) {
    return this.tournamentGamingRoomService.listGamingRooms(
      organizerId,
      tournamentId,
    );
  }

  async createGamingRoom(
    organizerId: string,
    tournamentId: string,
    dto: CreateGamingRoomDto,
  ) {
    return this.tournamentGamingRoomService.createGamingRoom(
      organizerId,
      tournamentId,
      dto,
    );
  }

  async getGamingRoom(
    organizerId: string,
    tournamentId: string,
    gamingRoomId: string,
  ) {
    return this.tournamentGamingRoomService.getGamingRoom(
      organizerId,
      tournamentId,
      gamingRoomId,
    );
  }

  async updateGamingRoom(
    organizerId: string,
    tournamentId: string,
    gamingRoomId: string,
    dto: UpdateGamingRoomDto,
  ) {
    return this.tournamentGamingRoomService.updateGamingRoom(
      organizerId,
      tournamentId,
      gamingRoomId,
      dto,
    );
  }

  async deleteGamingRoom(
    organizerId: string,
    tournamentId: string,
    gamingRoomId: string,
  ): Promise<void> {
    return this.tournamentGamingRoomService.deleteGamingRoom(
      organizerId,
      tournamentId,
      gamingRoomId,
    );
  }

  async getVenue(
    organizerId: string,
    tournamentId: string,
  ): Promise<VenueResponseDto> {
    return this.tournamentConfigurationService.getVenue(
      organizerId,
      tournamentId,
    );
  }

  async upsertVenue(
    organizerId: string,
    tournamentId: string,
    dto: UpsertVenueDto,
  ): Promise<VenueResponseDto> {
    return this.tournamentConfigurationService.upsertVenue(
      organizerId,
      tournamentId,
      dto,
    );
  }

  async getOnlineConfiguration(
    organizerId: string,
    tournamentId: string,
  ): Promise<OnlineConfigurationResponseDto> {
    return this.tournamentConfigurationService.getOnlineConfiguration(
      organizerId,
      tournamentId,
    );
  }

  async upsertOnlineConfiguration(
    organizerId: string,
    tournamentId: string,
    dto: UpsertOnlineConfigurationDto,
  ): Promise<OnlineConfigurationResponseDto> {
    return this.tournamentConfigurationService.upsertOnlineConfiguration(
      organizerId,
      tournamentId,
      dto,
    );
  }

  async listOrganizerTournaments(
    organizerId: string,
    query: ListOrganizerTournamentsQueryDto,
  ): Promise<OrganizerTournamentListResponseDto> {
    return this.tournamentQueryService.listOrganizerTournaments(
      organizerId,
      query,
    );
  }

  async publishOrganizerTournament(
    organizerId: string,
    tournamentId: string,
  ): Promise<TournamentResponseDto> {
    return this.tournamentManagementService.publishOrganizerTournament(
      organizerId,
      tournamentId,
    );
  }

  async updateOrganizerTournamentDraft(
    organizerId: string,
    tournamentId: string,
    dto: UpdateTournamentDraftDto,
  ): Promise<TournamentResponseDto> {
    return this.tournamentManagementService.updateOrganizerTournamentDraft(
      organizerId,
      tournamentId,
      dto,
    );
  }

  async uploadOrganizerTournamentCover(
    organizerId: string,
    tournamentId: string,
    file: TournamentCoverImageFile | undefined,
    publicOrigin: string,
  ): Promise<TournamentResponseDto> {
    return this.tournamentManagementService.uploadOrganizerTournamentCover(
      organizerId,
      tournamentId,
      file,
      publicOrigin,
    );
  }

  async deleteOrganizerTournamentDraft(
    organizerId: string,
    tournamentId: string,
  ): Promise<void> {
    return this.tournamentManagementService.deleteOrganizerTournamentDraft(
      organizerId,
      tournamentId,
    );
  }

  async getOrganizerTournamentDetails(
    organizerId: string,
    tournamentId: string,
  ): Promise<OrganizerTournamentDetailResponseDto> {
    return this.tournamentManagementService.getOrganizerTournamentDetails(
      organizerId,
      tournamentId,
    );
  }

  async createOrganizerDraft(
    organizerId: string,
    dto: CreateTournamentDto,
  ): Promise<TournamentResponseDto> {
    return this.tournamentManagementService.createOrganizerDraft(
      organizerId,
      dto,
    );
  }
}
