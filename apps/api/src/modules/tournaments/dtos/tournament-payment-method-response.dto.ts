import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TournamentPaymentMethodType } from '@clutcha/database';

export class TournamentPaymentMethodResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: TournamentPaymentMethodType })
  type!: TournamentPaymentMethodType;

  @ApiProperty()
  displayName!: string;

  @ApiProperty()
  enabled!: boolean;

  @ApiPropertyOptional({ nullable: true })
  accountHolderName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  accountIdentifier!: string | null;

  @ApiPropertyOptional({ nullable: true })
  phoneNumber!: string | null;

  @ApiPropertyOptional({ nullable: true })
  instapayAddress!: string | null;

  @ApiPropertyOptional({ nullable: true })
  bankName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  bankBranch!: string | null;

  @ApiPropertyOptional({ nullable: true })
  bankAccountNumber!: string | null;

  @ApiPropertyOptional({ nullable: true })
  iban!: string | null;

  @ApiPropertyOptional({ nullable: true })
  swiftCode!: string | null;

  @ApiPropertyOptional({ nullable: true })
  externalUrl!: string | null;

  @ApiProperty()
  instructions!: string;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;
}
