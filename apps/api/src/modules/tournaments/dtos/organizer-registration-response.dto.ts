import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  RegistrationApprovalStatus,
  RegistrationPaymentStatus,
  TeamStatus,
  TournamentRegistrationStatus,
} from '@clutcha/database';
import { CaptainRegistrationPaginationMetaDto } from './captain-registration-response.dto';
import { PaymentProofResponseDto } from './payment-proof-response.dto';
import { TournamentEligibilityIssueDto } from './tournament-eligibility-response.dto';

export class OrganizerRegistrationTeamDto {
  @ApiProperty({ example: 'team-id' })
  id!: string;

  @ApiProperty({ example: 'Cairo Titans' })
  name!: string;

  @ApiProperty({ example: 'cairo-titans' })
  slug!: string;

  @ApiProperty({ example: 'valorant' })
  gameKey!: string;

  @ApiPropertyOptional({ example: 'MENA' })
  region!: string | null;

  @ApiProperty({ enum: TeamStatus, example: TeamStatus.ACTIVE })
  status!: TeamStatus;
}

export class OrganizerRegistrationEligibilityDto {
  @ApiProperty({ example: true })
  eligible!: boolean;

  @ApiProperty({ type: [TournamentEligibilityIssueDto] })
  issues!: TournamentEligibilityIssueDto[];
}

export class OrganizerRegistrationListItemDto {
  @ApiProperty({ example: 'registration-id' })
  registrationId!: string;

  @ApiProperty({ type: OrganizerRegistrationTeamDto })
  team!: OrganizerRegistrationTeamDto;

  @ApiProperty({ enum: TournamentRegistrationStatus })
  status!: TournamentRegistrationStatus;

  @ApiProperty({ enum: RegistrationPaymentStatus })
  paymentStatus!: RegistrationPaymentStatus;

  @ApiProperty({ enum: RegistrationApprovalStatus })
  approvalStatus!: RegistrationApprovalStatus;

  @ApiProperty({ example: '1.0' })
  rulesVersion!: string;

  @ApiProperty({ example: '2026-08-04T16:00:00.000Z' })
  submittedAt!: Date;

  @ApiPropertyOptional({ example: 'Roster does not meet requirements.' })
  rejectionReason!: string | null;

  @ApiProperty({ type: OrganizerRegistrationEligibilityDto })
  eligibility!: OrganizerRegistrationEligibilityDto;
}

export class OrganizerRegistrationListResponseDto {
  @ApiProperty({ type: [OrganizerRegistrationListItemDto] })
  items!: OrganizerRegistrationListItemDto[];

  @ApiProperty({ type: CaptainRegistrationPaginationMetaDto })
  meta!: CaptainRegistrationPaginationMetaDto;
}

export class OrganizerRegistrationDetailResponseDto extends OrganizerRegistrationListItemDto {
  @ApiProperty({
    description:
      'Private Captain contact snapshot visible only to the owning organizer.',
    type: 'object',
    additionalProperties: true,
  })
  captainContactSnapshot!: unknown;

  @ApiProperty({
    description:
      'Private submitted roster snapshot visible only to the owning organizer.',
    type: 'array',
    items: { type: 'object' },
  })
  rosterSnapshot!: unknown;

  @ApiPropertyOptional({ example: '2026-08-04T17:00:00.000Z' })
  approvedAt!: Date | null;

  @ApiPropertyOptional({ example: '2026-08-04T17:00:00.000Z' })
  rejectedAt!: Date | null;

  @ApiPropertyOptional({
    type: PaymentProofResponseDto,
    nullable: true,
    description:
      'Latest submitted manual-payment proof visible only to the owning organizer.',
  })
  latestPaymentProof!: PaymentProofResponseDto | null;
}
