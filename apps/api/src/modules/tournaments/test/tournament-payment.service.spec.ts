import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  RegistrationPaymentStatus,
  TournamentPaymentMethodType,
  TournamentPaymentProofStatus,
  TournamentRegistrationStatus,
} from '@clutcha/database';
import { DatabaseService } from '../../../database/database.service';
import { type SubmitPaymentProofDto } from '../dtos/submit-payment-proof.dto';
import { type UpsertTournamentPaymentMethodDto } from '../dtos/upsert-tournament-payment-method.dto';
import { TournamentPaymentService } from '../services/tournament-payment.service';
import { TournamentPaymentProofStorageService } from '../services/tournament-payment-proof-storage.service';

jest.mock('@clutcha/database', () => ({
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      code: string;

      constructor(message: string, options: { code: string }) {
        super(message);
        this.code = options.code;
      }
    },
  },
  RegistrationPaymentStatus: {
    NOT_REQUIRED: 'NOT_REQUIRED',
    AWAITING_PROOF: 'AWAITING_PROOF',
    PROOF_SUBMITTED: 'PROOF_SUBMITTED',
    VERIFIED: 'VERIFIED',
    REJECTED: 'REJECTED',
  },
  TournamentPaymentMethodType: {
    INSTAPAY: 'INSTAPAY',
    VODAFONE_CASH: 'VODAFONE_CASH',
    BANK_TRANSFER: 'BANK_TRANSFER',
    EXTERNAL_LINK: 'EXTERNAL_LINK',
    OTHER: 'OTHER',
  },
  TournamentPaymentProofStatus: {
    SUBMITTED: 'SUBMITTED',
    VERIFIED: 'VERIFIED',
    REJECTED: 'REJECTED',
    SUPERSEDED: 'SUPERSEDED',
  },
  TournamentRegistrationStatus: {
    PENDING_APPROVAL: 'PENDING_APPROVAL',
  },
  TournamentStatus: { DRAFT: 'DRAFT', ARCHIVED: 'ARCHIVED' },
}));

describe('TournamentPaymentService', () => {
  const organizerId = 'organizer-1';
  const tournamentId = 'tournament-1';
  const paymentMethodId = 'payment-method-1';
  let service: TournamentPaymentService;
  let tournamentFindFirst: jest.Mock;
  let paymentMethodFindMany: jest.Mock;
  let paymentMethodFindFirst: jest.Mock;
  let paymentMethodCreate: jest.Mock;
  let paymentMethodUpdate: jest.Mock;
  let paymentMethodDelete: jest.Mock;
  let registrationFindFirst: jest.Mock;
  let proofFindFirst: jest.Mock;
  let proofCreate: jest.Mock;
  let proofUpdate: jest.Mock;
  let proofUpdateMany: jest.Mock;
  let registrationUpdate: jest.Mock;
  let saveProofFile: jest.Mock;
  let client: Record<string, unknown>;

  const paymentMethod = (overrides: Record<string, unknown> = {}) => ({
    id: paymentMethodId,
    type: TournamentPaymentMethodType.VODAFONE_CASH,
    displayName: 'Vodafone Cash',
    enabled: true,
    accountHolderName: 'CLUTCHA',
    accountIdentifier: '01000000000',
    phoneNumber: '01000000000',
    instapayAddress: null,
    bankName: null,
    bankBranch: null,
    bankAccountNumber: null,
    iban: null,
    swiftCode: null,
    externalUrl: null,
    instructions: 'Send the exact amount and include your reference.',
    notes: null,
    ...overrides,
  });

  const proof = (overrides: Record<string, unknown> = {}) => ({
    id: 'proof-1',
    status: TournamentPaymentProofStatus.SUBMITTED,
    expectedAmount: { toString: () => '150.00' },
    currency: 'EGP',
    proofUrl: 'http://localhost/uploads/proof.png',
    originalName: 'receipt.png',
    mimeType: 'image/png',
    fileSize: 100,
    transactionReference: 'TX-1',
    paidAt: new Date('2026-01-01T00:00:00.000Z'),
    captainNote: 'Paid from team account.',
    submittedAt: new Date('2026-01-01T00:00:00.000Z'),
    verifiedAt: null,
    verifiedById: null,
    rejectedAt: null,
    rejectedById: null,
    rejectionReason: null,
    paymentMethod: paymentMethod(),
    ...overrides,
  });

  beforeEach(() => {
    tournamentFindFirst = jest.fn().mockResolvedValue({ id: tournamentId });
    paymentMethodFindMany = jest.fn().mockResolvedValue([paymentMethod()]);
    paymentMethodFindFirst = jest.fn().mockResolvedValue(paymentMethod());
    paymentMethodCreate = jest.fn().mockResolvedValue(paymentMethod());
    paymentMethodUpdate = jest
      .fn()
      .mockResolvedValue(paymentMethod({ displayName: 'Updated Cash' }));
    paymentMethodDelete = jest.fn().mockResolvedValue(paymentMethod());
    registrationFindFirst = jest.fn().mockResolvedValue({
      id: 'registration-1',
      captainId: 'captain-1',
      paymentStatus: RegistrationPaymentStatus.AWAITING_PROOF,
      tournament: {
        id: tournamentId,
        registrationFee: { toString: () => '150.00' },
        currency: 'EGP',
        registrationClosesAt: new Date('2030-01-01T00:00:00.000Z'),
      },
    });
    proofFindFirst = jest.fn().mockResolvedValue(proof());
    proofCreate = jest.fn().mockResolvedValue(proof());
    proofUpdate = jest
      .fn()
      .mockResolvedValueOnce(
        proof({
          status: TournamentPaymentProofStatus.VERIFIED,
          verifiedById: organizerId,
        }),
      )
      .mockResolvedValue(
        proof({ status: TournamentPaymentProofStatus.REJECTED }),
      );
    proofUpdateMany = jest.fn().mockResolvedValue({ count: 0 });
    registrationUpdate = jest.fn().mockResolvedValue({});
    saveProofFile = jest
      .fn()
      .mockResolvedValue(
        'http://localhost/uploads/payment-proofs/registration-1/proof.png',
      );

    client = {
      tournament: { findFirst: tournamentFindFirst },
      tournamentPaymentMethod: {
        findMany: paymentMethodFindMany,
        findFirst: paymentMethodFindFirst,
        create: paymentMethodCreate,
        update: paymentMethodUpdate,
        delete: paymentMethodDelete,
      },
      tournamentRegistration: {
        findFirst: registrationFindFirst,
        update: registrationUpdate,
      },
      tournamentRegistrationPaymentProof: {
        findFirst: proofFindFirst,
        create: proofCreate,
        update: proofUpdate,
        updateMany: proofUpdateMany,
      },
    };
    client.$transaction = jest.fn((callback: (value: unknown) => unknown) =>
      callback(client),
    );

    service = new TournamentPaymentService(
      { client } as unknown as DatabaseService,
      { saveProofFile } as unknown as TournamentPaymentProofStorageService,
    );
  });

  const methodDto = (): UpsertTournamentPaymentMethodDto => ({
    type: TournamentPaymentMethodType.VODAFONE_CASH,
    displayName: 'Vodafone Cash',
    enabled: true,
    instructions: 'Send the exact amount and include your reference.',
  });

  it('manages organizer payment methods within the owned tournament', async () => {
    await service.listOrganizerTournamentPaymentMethods(
      organizerId,
      tournamentId,
    );
    await service.createOrganizerTournamentPaymentMethod(
      organizerId,
      tournamentId,
      methodDto(),
    );
    await service.updateOrganizerTournamentPaymentMethod(
      organizerId,
      tournamentId,
      paymentMethodId,
      methodDto(),
    );
    await service.deleteOrganizerTournamentPaymentMethod(
      organizerId,
      tournamentId,
      paymentMethodId,
    );

    const createArgs = (
      paymentMethodCreate.mock.calls as unknown as Array<
        [{ data: Record<string, unknown> }]
      >
    )[0]?.[0];
    expect(createArgs.data).toMatchObject({
      tournamentId,
      displayName: 'Vodafone Cash',
    });
    expect(paymentMethodUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: paymentMethodId } }),
    );
    expect(paymentMethodDelete).toHaveBeenCalledWith({
      where: { id: paymentMethodId },
    });
  });

  it('lists only enabled payment methods for captains of published tournaments', async () => {
    const result = (await service.listCaptainTournamentPaymentMethods(
      tournamentId,
    )) as unknown as Array<Record<string, unknown>>;

    expect(result[0]).toMatchObject({
      id: paymentMethodId,
      displayName: 'Vodafone Cash',
    });
    expect(paymentMethodFindMany).toHaveBeenCalledWith({
      where: { tournamentId, enabled: true },
      orderBy: { createdAt: 'asc' },
    });
  });

  it('submits a payment proof and moves the registration to pending approval', async () => {
    const dto: SubmitPaymentProofDto = {
      paymentMethodId,
      transactionReference: 'TX-1',
      paidAt: '2026-01-01T00:00:00.000Z',
      captainNote: 'Paid from team account.',
    };

    const result = (await service.submitCaptainRegistrationPaymentProof(
      'captain-1',
      'registration-1',
      dto,
      {
        originalname: 'receipt.png',
        mimetype: 'image/png',
        buffer: Buffer.from('proof'),
        size: 100,
      },
      'http://localhost',
    )) as unknown as Record<string, unknown>;

    expect(result).toMatchObject({ id: 'proof-1', expectedAmount: '150.00' });
    expect(proofUpdateMany).toHaveBeenCalled();
    const proofCreateArgs = (
      proofCreate.mock.calls as unknown as Array<
        [{ data: Record<string, unknown> }]
      >
    )[0]?.[0];
    expect(proofCreateArgs.data).toMatchObject({
      registrationId: 'registration-1',
      paymentMethodId,
    });
    expect(proofCreateArgs.data.proofUrl).toEqual(
      expect.stringContaining('/payment-proofs/'),
    );
    expect(registrationUpdate).toHaveBeenCalledWith({
      where: { id: 'registration-1' },
      data: {
        status: TournamentRegistrationStatus.PENDING_APPROVAL,
        paymentStatus: RegistrationPaymentStatus.PROOF_SUBMITTED,
      },
    });
  });

  it('verifies and rejects submitted payment proofs through transactions', async () => {
    const verified = (await service.verifyOrganizerRegistrationPaymentProof(
      organizerId,
      tournamentId,
      'registration-1',
    )) as unknown as Record<string, unknown>;
    expect(verified.status).toBe(TournamentPaymentProofStatus.VERIFIED);

    const rejected = (await service.rejectOrganizerRegistrationPaymentProof(
      organizerId,
      tournamentId,
      'registration-1',
      { reason: 'The receipt does not match the registration.' },
    )) as unknown as Record<string, unknown>;
    expect(rejected.id).toBe('proof-1');
    const proofUpdateArgs = (
      proofUpdate.mock.calls as unknown as Array<
        [{ data: Record<string, unknown> }]
      >
    )[1]?.[0];
    expect(proofUpdateArgs.data).toMatchObject({
      rejectionReason: 'The receipt does not match the registration.',
    });
  });

  it('rejects missing ownership and unavailable payment proof storage', async () => {
    tournamentFindFirst.mockResolvedValueOnce(null);
    await expect(
      service.listOrganizerTournamentPaymentMethods(organizerId, tournamentId),
    ).rejects.toBeInstanceOf(NotFoundException);

    service = new TournamentPaymentService({
      client,
    } as unknown as DatabaseService);
    await expect(
      service.submitCaptainRegistrationPaymentProof(
        'captain-1',
        'registration-1',
        { paymentMethodId },
        undefined,
        'http://localhost',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
