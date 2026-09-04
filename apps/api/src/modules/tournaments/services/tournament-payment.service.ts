import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  RegistrationPaymentStatus,
  TournamentPaymentMethodType,
  TournamentPaymentProofStatus,
  TournamentRegistrationStatus,
  TournamentStatus,
} from '@clutcha/database';
import { DatabaseService } from '../../../database/database.service';
import { type RejectPaymentProofDto } from '../dtos/reject-payment-proof.dto';
import { type SubmitPaymentProofDto } from '../dtos/submit-payment-proof.dto';
import { type UpsertTournamentPaymentMethodDto } from '../dtos/upsert-tournament-payment-method.dto';
import {
  TournamentPaymentProofStorageService,
  type TournamentPaymentProofFile,
} from './tournament-payment-proof-storage.service';

type PaymentMethodRecord = {
  id: string;
  type: TournamentPaymentMethodType;
  displayName: string;
  enabled: boolean;
  accountHolderName: string | null;
  accountIdentifier: string | null;
  phoneNumber: string | null;
  instapayAddress: string | null;
  bankName: string | null;
  bankBranch: string | null;
  bankAccountNumber: string | null;
  iban: string | null;
  swiftCode: string | null;
  externalUrl: string | null;
  instructions: string;
  notes: string | null;
};

@Injectable()
export class TournamentPaymentService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly paymentProofStorageService?: TournamentPaymentProofStorageService,
  ) {}

  async listOrganizerTournamentPaymentMethods(
    organizerId: string,
    tournamentId: string,
  ) {
    await this.findOwnedTournamentOrThrow(organizerId, tournamentId);

    const methods =
      await this.databaseService.client.tournamentPaymentMethod.findMany({
        where: { tournamentId },
        orderBy: [{ enabled: 'desc' }, { createdAt: 'asc' }],
      });

    return methods.map((method) => this.toPaymentMethodResponse(method));
  }

  async listCaptainTournamentPaymentMethods(tournamentId: string) {
    const tournament = await this.databaseService.client.tournament.findFirst({
      where: {
        id: tournamentId,
        status: {
          notIn: [TournamentStatus.DRAFT, TournamentStatus.ARCHIVED],
        },
      },
      select: { id: true },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament was not found');
    }

    const methods =
      await this.databaseService.client.tournamentPaymentMethod.findMany({
        where: { tournamentId, enabled: true },
        orderBy: { createdAt: 'asc' },
      });

    return methods.map((method) => this.toPaymentMethodResponse(method));
  }

  async createOrganizerTournamentPaymentMethod(
    organizerId: string,
    tournamentId: string,
    dto: UpsertTournamentPaymentMethodDto,
  ) {
    await this.findOwnedTournamentOrThrow(organizerId, tournamentId);

    const method =
      await this.databaseService.client.tournamentPaymentMethod.create({
        data: {
          tournamentId,
          ...this.toPaymentMethodData(dto),
        },
      });

    return this.toPaymentMethodResponse(method);
  }

  async updateOrganizerTournamentPaymentMethod(
    organizerId: string,
    tournamentId: string,
    paymentMethodId: string,
    dto: UpsertTournamentPaymentMethodDto,
  ) {
    await this.findOwnedTournamentOrThrow(organizerId, tournamentId);
    await this.findPaymentMethodOrThrow(tournamentId, paymentMethodId);

    const method =
      await this.databaseService.client.tournamentPaymentMethod.update({
        where: { id: paymentMethodId },
        data: this.toPaymentMethodData(dto),
      });

    return this.toPaymentMethodResponse(method);
  }

  async deleteOrganizerTournamentPaymentMethod(
    organizerId: string,
    tournamentId: string,
    paymentMethodId: string,
  ) {
    await this.findOwnedTournamentOrThrow(organizerId, tournamentId);
    await this.findPaymentMethodOrThrow(tournamentId, paymentMethodId);

    const method =
      await this.databaseService.client.tournamentPaymentMethod.delete({
        where: { id: paymentMethodId },
      });

    return this.toPaymentMethodResponse(method);
  }

  async submitCaptainRegistrationPaymentProof(
    captainId: string,
    registrationId: string,
    dto: SubmitPaymentProofDto,
    file: TournamentPaymentProofFile | undefined,
    publicOrigin: string,
  ) {
    const registration =
      await this.databaseService.client.tournamentRegistration.findFirst({
        where: { id: registrationId, captainId },
        include: {
          tournament: {
            select: {
              id: true,
              registrationFee: true,
              currency: true,
              registrationClosesAt: true,
            },
          },
        },
      });

    if (!registration) {
      throw new NotFoundException('Captain registration was not found');
    }

    if (registration.paymentStatus === RegistrationPaymentStatus.NOT_REQUIRED) {
      throw new ConflictException(
        'This registration does not require payment.',
      );
    }

    if (registration.paymentStatus === RegistrationPaymentStatus.VERIFIED) {
      throw new ConflictException('This payment has already been verified.');
    }

    if (new Date() > registration.tournament.registrationClosesAt) {
      throw new ConflictException(
        'Payment proof can no longer be submitted after registration closes.',
      );
    }

    const paymentMethod = await this.findEnabledPaymentMethodOrThrow(
      registration.tournament.id,
      dto.paymentMethodId,
    );

    if (!this.paymentProofStorageService) {
      throw new ConflictException('Payment proof storage is not available.');
    }

    const proofUrl = await this.paymentProofStorageService.saveProofFile(
      registration.id,
      file,
      publicOrigin,
    );

    const proof = await this.databaseService.client.$transaction(
      async (transaction) => {
        await transaction.tournamentRegistrationPaymentProof.updateMany({
          where: {
            registrationId,
            status: TournamentPaymentProofStatus.SUBMITTED,
          },
          data: {
            status: TournamentPaymentProofStatus.SUPERSEDED,
          },
        });

        const created =
          await transaction.tournamentRegistrationPaymentProof.create({
            data: {
              registrationId,
              paymentMethodId: paymentMethod.id,
              expectedAmount: registration.tournament.registrationFee,
              currency: registration.tournament.currency,
              proofUrl,
              originalName: file?.originalname ?? 'payment-proof',
              mimeType: file?.mimetype ?? 'application/octet-stream',
              fileSize: file?.size ?? 0,
              transactionReference: dto.transactionReference,
              paidAt: dto.paidAt ? new Date(dto.paidAt) : null,
              captainNote: dto.captainNote,
            },
            include: { paymentMethod: true },
          });

        await transaction.tournamentRegistration.update({
          where: { id: registrationId },
          data: {
            status: TournamentRegistrationStatus.PENDING_APPROVAL,
            paymentStatus: RegistrationPaymentStatus.PROOF_SUBMITTED,
          },
        });

        return created;
      },
    );

    return this.toPaymentProofResponse(proof);
  }

  async verifyOrganizerRegistrationPaymentProof(
    organizerId: string,
    tournamentId: string,
    registrationId: string,
  ) {
    await this.findOwnedTournamentOrThrow(organizerId, tournamentId);
    const proof = await this.findCurrentSubmittedPaymentProofOrThrow(
      tournamentId,
      registrationId,
    );

    const updated = await this.databaseService.client.$transaction(
      async (transaction) => {
        const verified =
          await transaction.tournamentRegistrationPaymentProof.update({
            where: { id: proof.id },
            data: {
              status: TournamentPaymentProofStatus.VERIFIED,
              verifiedAt: new Date(),
              verifiedById: organizerId,
              rejectedAt: null,
              rejectedById: null,
              rejectionReason: null,
            },
            include: { paymentMethod: true },
          });

        await transaction.tournamentRegistration.update({
          where: { id: registrationId },
          data: { paymentStatus: RegistrationPaymentStatus.VERIFIED },
        });

        return verified;
      },
    );

    return this.toPaymentProofResponse(updated);
  }

  async rejectOrganizerRegistrationPaymentProof(
    organizerId: string,
    tournamentId: string,
    registrationId: string,
    dto: RejectPaymentProofDto,
  ) {
    await this.findOwnedTournamentOrThrow(organizerId, tournamentId);
    const proof = await this.findCurrentSubmittedPaymentProofOrThrow(
      tournamentId,
      registrationId,
    );

    const updated = await this.databaseService.client.$transaction(
      async (transaction) => {
        const rejected =
          await transaction.tournamentRegistrationPaymentProof.update({
            where: { id: proof.id },
            data: {
              status: TournamentPaymentProofStatus.REJECTED,
              rejectedAt: new Date(),
              rejectedById: organizerId,
              rejectionReason: dto.reason,
            },
            include: { paymentMethod: true },
          });

        await transaction.tournamentRegistration.update({
          where: { id: registrationId },
          data: { paymentStatus: RegistrationPaymentStatus.REJECTED },
        });

        return rejected;
      },
    );

    return this.toPaymentProofResponse(updated);
  }

  private async findOwnedTournamentOrThrow(
    organizerId: string,
    tournamentId: string,
  ): Promise<{ id: string }> {
    const tournament = await this.databaseService.client.tournament.findFirst({
      where: {
        id: tournamentId,
        organizerId,
      },
      select: { id: true },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament was not found');
    }

    return tournament;
  }

  private toPaymentMethodData(dto: UpsertTournamentPaymentMethodDto) {
    return {
      type: dto.type,
      displayName: dto.displayName,
      enabled: dto.enabled ?? true,
      accountHolderName: dto.accountHolderName,
      accountIdentifier: dto.accountIdentifier,
      phoneNumber: dto.phoneNumber,
      instapayAddress: dto.instapayAddress,
      bankName: dto.bankName,
      bankBranch: dto.bankBranch,
      bankAccountNumber: dto.bankAccountNumber,
      iban: dto.iban,
      swiftCode: dto.swiftCode,
      externalUrl: dto.externalUrl,
      instructions: dto.instructions,
      notes: dto.notes,
    };
  }

  private toPaymentMethodResponse(method: {
    id: string;
    type: TournamentPaymentMethodType;
    displayName: string;
    enabled: boolean;
    accountHolderName: string | null;
    accountIdentifier: string | null;
    phoneNumber: string | null;
    instapayAddress: string | null;
    bankName: string | null;
    bankBranch: string | null;
    bankAccountNumber: string | null;
    iban: string | null;
    swiftCode: string | null;
    externalUrl: string | null;
    instructions: string;
    notes: string | null;
  }) {
    return {
      id: method.id,
      type: method.type,
      displayName: method.displayName,
      enabled: method.enabled,
      accountHolderName: method.accountHolderName,
      accountIdentifier: method.accountIdentifier,
      phoneNumber: method.phoneNumber,
      instapayAddress: method.instapayAddress,
      bankName: method.bankName,
      bankBranch: method.bankBranch,
      bankAccountNumber: method.bankAccountNumber,
      iban: method.iban,
      swiftCode: method.swiftCode,
      externalUrl: method.externalUrl,
      instructions: method.instructions,
      notes: method.notes,
    };
  }

  toPaymentProofResponse(proof: {
    id: string;
    status: TournamentPaymentProofStatus;
    expectedAmount: { toString(): string };
    currency: string;
    proofUrl: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    transactionReference: string | null;
    paidAt: Date | null;
    captainNote: string | null;
    submittedAt: Date;
    verifiedAt: Date | null;
    verifiedById: string | null;
    rejectedAt: Date | null;
    rejectedById: string | null;
    rejectionReason: string | null;
    paymentMethod: PaymentMethodRecord;
  }) {
    return {
      id: proof.id,
      status: proof.status,
      expectedAmount: proof.expectedAmount.toString(),
      currency: proof.currency,
      proofUrl: proof.proofUrl,
      originalName: proof.originalName,
      mimeType: proof.mimeType,
      fileSize: proof.fileSize,
      transactionReference: proof.transactionReference,
      paidAt: proof.paidAt,
      captainNote: proof.captainNote,
      submittedAt: proof.submittedAt,
      verifiedAt: proof.verifiedAt,
      verifiedById: proof.verifiedById,
      rejectedAt: proof.rejectedAt,
      rejectedById: proof.rejectedById,
      rejectionReason: proof.rejectionReason,
      paymentMethod: this.toPaymentMethodResponse(proof.paymentMethod),
    };
  }

  private async findPaymentMethodOrThrow(
    tournamentId: string,
    paymentMethodId: string,
  ) {
    const method =
      await this.databaseService.client.tournamentPaymentMethod.findFirst({
        where: { id: paymentMethodId, tournamentId },
      });

    if (!method) {
      throw new NotFoundException('Tournament payment method was not found');
    }

    return method;
  }

  private async findEnabledPaymentMethodOrThrow(
    tournamentId: string,
    paymentMethodId: string,
  ) {
    const method =
      await this.databaseService.client.tournamentPaymentMethod.findFirst({
        where: { id: paymentMethodId, tournamentId, enabled: true },
      });

    if (!method) {
      throw new NotFoundException(
        'An active tournament payment method was not found',
      );
    }

    return method;
  }

  private async findCurrentSubmittedPaymentProofOrThrow(
    tournamentId: string,
    registrationId: string,
  ) {
    const proof =
      await this.databaseService.client.tournamentRegistrationPaymentProof.findFirst(
        {
          where: {
            registrationId,
            status: TournamentPaymentProofStatus.SUBMITTED,
            registration: { tournamentId },
          },
          include: { paymentMethod: true },
          orderBy: { submittedAt: 'desc' },
        },
      );

    if (!proof) {
      throw new NotFoundException('Submitted payment proof was not found');
    }

    return proof;
  }

  private isPrismaUniqueConstraintError(
    error: unknown,
  ): error is Prisma.PrismaClientKnownRequestError {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
