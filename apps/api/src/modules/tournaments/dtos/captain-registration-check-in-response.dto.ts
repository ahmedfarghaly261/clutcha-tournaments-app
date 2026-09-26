import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  RegistrationApprovalStatus,
  RegistrationPaymentStatus,
  TournamentMode,
  TournamentRegistrationStatus,
} from '@clutcha/database';

export class CaptainCheckInIssueDto {
  @ApiProperty({ example: 'registration.approvalStatus' })
  field!: string;

  @ApiProperty({ example: 'Organizer must approve the team before check-in.' })
  message!: string;
}

export class CaptainCheckInTournamentDto {
  @ApiProperty({ example: 'tournament-id' })
  id!: string;

  @ApiProperty({ example: 'CLUTCHA Valorant Cairo Cup' })
  name!: string;

  @ApiProperty({ enum: TournamentMode, example: TournamentMode.ONLINE })
  mode!: TournamentMode;

  @ApiProperty({ example: 'Africa/Cairo' })
  timezone!: string;
}

export class CaptainCheckInRegistrationDto {
  @ApiProperty({ enum: TournamentRegistrationStatus })
  status!: TournamentRegistrationStatus;

  @ApiProperty({ enum: RegistrationApprovalStatus })
  approvalStatus!: RegistrationApprovalStatus;

  @ApiProperty({
    enum: RegistrationPaymentStatus,
    description:
      'Informational only for offline/direct organizer payment workflows; organizer approval is the check-in gate.',
  })
  paymentStatus!: RegistrationPaymentStatus;

  @ApiPropertyOptional({ example: '2026-09-12T16:30:00.000Z' })
  checkedInAt!: Date | null;
}

export class CaptainCheckInInstructionsDto {
  @ApiPropertyOptional({
    example: 'Captains must check in 30 minutes before start.',
  })
  checkInInstructions!: string | null;

  @ApiPropertyOptional({ example: '2026-09-12T16:30:00.000Z' })
  arrivalTime!: Date | null;

  @ApiPropertyOptional({ example: 'EU West' })
  serverRegion!: string | null;

  @ApiPropertyOptional({ example: 'Use assigned lobby only.' })
  onlineInstructions!: string | null;

  @ApiPropertyOptional({ example: 'CLUTCHA Arena Cairo' })
  venueName!: string | null;

  @ApiPropertyOptional({ example: 'Main entrance desk' })
  checkInLocation!: string | null;

  @ApiPropertyOptional({ example: 'Main Stage Room' })
  assignedRoomName!: string | null;

  @ApiPropertyOptional({ example: 'Station A-04' })
  assignedStation!: string | null;
}

export class CaptainRegistrationCheckInResponseDto {
  @ApiProperty({ example: 'registration-id' })
  registrationId!: string;

  @ApiProperty({ type: CaptainCheckInTournamentDto })
  tournament!: CaptainCheckInTournamentDto;

  @ApiProperty({ type: CaptainCheckInRegistrationDto })
  registration!: CaptainCheckInRegistrationDto;

  @ApiProperty({ example: true })
  canCheckIn!: boolean;

  @ApiProperty({ example: true })
  checkedIn!: boolean;

  @ApiProperty({ type: CaptainCheckInIssueDto, isArray: true })
  outstandingIssues!: CaptainCheckInIssueDto[];

  @ApiProperty({ type: CaptainCheckInInstructionsDto })
  instructions!: CaptainCheckInInstructionsDto;
}
