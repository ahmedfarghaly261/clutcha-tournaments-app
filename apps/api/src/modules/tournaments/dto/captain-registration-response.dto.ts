import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  RegistrationApprovalStatus,
  RegistrationPaymentStatus,
  TournamentMode,
  TournamentRegistrationStatus,
  TournamentStatus,
} from '@clutcha/database';

export enum CaptainRegistrationNextAction {
  COMPLETE_PAYMENT = 'COMPLETE_PAYMENT',
  WAIT_FOR_APPROVAL = 'WAIT_FOR_APPROVAL',
  REVIEW_REJECTION = 'REVIEW_REJECTION',
  CHECK_IN = 'CHECK_IN',
  OPEN_TOURNAMENT_HUB = 'OPEN_TOURNAMENT_HUB',
  VIEW_MATCH = 'VIEW_MATCH',
  TOURNAMENT_COMPLETED = 'TOURNAMENT_COMPLETED',
  NONE = 'NONE',
}

export class CaptainRegistrationTournamentSummaryDto {
  @ApiProperty({ example: 'tournament-id' })
  id!: string;

  @ApiProperty({ example: 'clutcha-valorant-cairo-cup' })
  slug!: string;

  @ApiProperty({ example: 'CLUTCHA Valorant Cairo Cup' })
  name!: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.png' })
  logoUrl!: string | null;

  @ApiProperty({ example: 'valorant' })
  gameKey!: string;

  @ApiProperty({ enum: TournamentMode, example: TournamentMode.ONLINE })
  mode!: TournamentMode;

  @ApiProperty({
    enum: TournamentStatus,
    example: TournamentStatus.REGISTRATION_OPEN,
  })
  status!: TournamentStatus;

  @ApiProperty({ example: '2026-09-12T18:00:00.000Z' })
  startsAt!: Date;

  @ApiProperty({ example: '0' })
  registrationFee!: string;

  @ApiProperty({ example: 'EGP' })
  currency!: string;
}

export class CaptainRegistrationListItemDto {
  @ApiProperty({ example: 'registration-id' })
  registrationId!: string;

  @ApiProperty({ type: CaptainRegistrationTournamentSummaryDto })
  tournament!: CaptainRegistrationTournamentSummaryDto;

  @ApiProperty({ enum: TournamentRegistrationStatus })
  status!: TournamentRegistrationStatus;

  @ApiProperty({ enum: RegistrationPaymentStatus })
  paymentStatus!: RegistrationPaymentStatus;

  @ApiProperty({ enum: RegistrationApprovalStatus })
  approvalStatus!: RegistrationApprovalStatus;

  @ApiProperty({ example: '2026-08-04T16:00:00.000Z' })
  submittedAt!: Date;

  @ApiPropertyOptional({ example: 'Roster does not meet requirements.' })
  rejectionReason!: string | null;

  @ApiProperty({ enum: CaptainRegistrationNextAction })
  nextAction!: CaptainRegistrationNextAction;
}

export class CaptainRegistrationPaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 42 })
  totalItems!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;

  @ApiProperty({ example: true })
  hasNextPage!: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage!: boolean;
}

export class CaptainRegistrationListResponseDto {
  @ApiProperty({ type: [CaptainRegistrationListItemDto] })
  items!: CaptainRegistrationListItemDto[];

  @ApiProperty({ type: CaptainRegistrationPaginationMetaDto })
  meta!: CaptainRegistrationPaginationMetaDto;
}

export class CaptainRegistrationLifecycleDto {
  @ApiProperty({ enum: TournamentRegistrationStatus })
  status!: TournamentRegistrationStatus;

  @ApiProperty({ enum: RegistrationPaymentStatus })
  paymentStatus!: RegistrationPaymentStatus;

  @ApiProperty({ enum: RegistrationApprovalStatus })
  approvalStatus!: RegistrationApprovalStatus;

  @ApiProperty({ example: '2026-08-04T16:00:00.000Z' })
  submittedAt!: Date;

  @ApiPropertyOptional({ example: '2026-08-04T17:00:00.000Z' })
  approvedAt!: Date | null;

  @ApiPropertyOptional({ example: '2026-08-04T17:00:00.000Z' })
  rejectedAt!: Date | null;

  @ApiPropertyOptional({ example: 'Roster does not meet requirements.' })
  rejectionReason!: string | null;

  @ApiPropertyOptional({ example: '2026-08-04T18:00:00.000Z' })
  withdrawnAt!: Date | null;

  @ApiPropertyOptional({ example: '2026-08-05T09:00:00.000Z' })
  checkedInAt!: Date | null;

  @ApiPropertyOptional({ example: '2026-08-05T10:00:00.000Z' })
  disqualifiedAt!: Date | null;
}

export class CaptainRegistrationDetailResponseDto {
  @ApiProperty({ example: 'registration-id' })
  registrationId!: string;

  @ApiProperty({ type: CaptainRegistrationTournamentSummaryDto })
  tournament!: CaptainRegistrationTournamentSummaryDto;

  @ApiProperty({ type: CaptainRegistrationLifecycleDto })
  lifecycle!: CaptainRegistrationLifecycleDto;

  @ApiProperty({ example: '1.0' })
  rulesVersion!: string;

  @ApiProperty({ example: '2026-08-04T16:00:00.000Z' })
  rulesAcceptedAt!: Date;

  @ApiProperty({
    description:
      'Private submitted roster snapshot visible only to the owning Captain.',
    type: 'array',
    items: { type: 'object' },
  })
  rosterSnapshot!: unknown;

  @ApiProperty({
    description:
      'Private Captain contact snapshot visible only to the owning Captain.',
    type: 'object',
    additionalProperties: true,
  })
  captainContactSnapshot!: unknown;

  @ApiProperty({ enum: CaptainRegistrationNextAction })
  nextAction!: CaptainRegistrationNextAction;
}
