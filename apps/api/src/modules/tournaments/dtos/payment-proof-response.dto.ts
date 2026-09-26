import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TournamentPaymentProofStatus } from '@clutcha/database';
import { TournamentPaymentMethodResponseDto } from './tournament-payment-method-response.dto';

export class PaymentProofResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: TournamentPaymentProofStatus })
  status!: TournamentPaymentProofStatus;

  @ApiProperty()
  expectedAmount!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  proofUrl!: string;

  @ApiProperty()
  originalName!: string;

  @ApiProperty()
  mimeType!: string;

  @ApiProperty()
  fileSize!: number;

  @ApiPropertyOptional({ nullable: true })
  transactionReference!: string | null;

  @ApiPropertyOptional({ nullable: true })
  paidAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  captainNote!: string | null;

  @ApiProperty()
  submittedAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  verifiedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  verifiedById!: string | null;

  @ApiPropertyOptional({ nullable: true })
  rejectedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  rejectedById!: string | null;

  @ApiPropertyOptional({ nullable: true })
  rejectionReason!: string | null;

  @ApiProperty({ type: TournamentPaymentMethodResponseDto })
  paymentMethod!: TournamentPaymentMethodResponseDto;
}
