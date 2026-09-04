import { ApiProperty } from '@nestjs/swagger';
import {
  RegistrationApprovalStatus,
  RegistrationPaymentStatus,
  TournamentMode,
  TournamentRegistrationStatus,
} from '@clutcha/database';

export class TournamentRegistrationTournamentSummaryDto {
  @ApiProperty({ example: 'tournament-id' })
  id!: string;

  @ApiProperty({ example: 'clutcha-valorant-cairo-cup' })
  slug!: string;

  @ApiProperty({ example: 'CLUTCHA Valorant Cairo Cup' })
  name!: string;

  @ApiProperty({ example: 'valorant' })
  gameKey!: string;

  @ApiProperty({ enum: TournamentMode, example: TournamentMode.ONLINE })
  mode!: TournamentMode;

  @ApiProperty({ example: '0' })
  registrationFee!: string;

  @ApiProperty({ example: 'EGP' })
  currency!: string;

  @ApiProperty({ example: '2026-09-12T18:00:00.000Z' })
  startsAt!: Date;
}

export class TournamentRegistrationTeamSummaryDto {
  @ApiProperty({ example: 'team-id' })
  id!: string;

  @ApiProperty({ example: 'Cairo Titans' })
  name!: string;
}

export class TournamentRegistrationResponseDto {
  @ApiProperty({ example: 'registration-id' })
  id!: string;

  @ApiProperty({
    enum: TournamentRegistrationStatus,
    example: TournamentRegistrationStatus.PENDING_APPROVAL,
  })
  status!: TournamentRegistrationStatus;

  @ApiProperty({
    enum: RegistrationPaymentStatus,
    example: RegistrationPaymentStatus.NOT_REQUIRED,
  })
  paymentStatus!: RegistrationPaymentStatus;

  @ApiProperty({
    enum: RegistrationApprovalStatus,
    example: RegistrationApprovalStatus.PENDING,
  })
  approvalStatus!: RegistrationApprovalStatus;

  @ApiProperty({ example: '1.0' })
  rulesVersion!: string;

  @ApiProperty({ example: '2026-08-04T16:00:00.000Z' })
  rulesAcceptedAt!: Date;

  @ApiProperty({ example: '2026-08-04T16:00:00.000Z' })
  submittedAt!: Date;

  @ApiProperty({ type: TournamentRegistrationTournamentSummaryDto })
  tournament!: TournamentRegistrationTournamentSummaryDto;

  @ApiProperty({ type: TournamentRegistrationTeamSummaryDto })
  team!: TournamentRegistrationTeamSummaryDto;
}
