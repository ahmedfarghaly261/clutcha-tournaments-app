ALTER TYPE "RegistrationPaymentStatus" ADD VALUE IF NOT EXISTS 'AWAITING_PROOF';
ALTER TYPE "RegistrationPaymentStatus" ADD VALUE IF NOT EXISTS 'PROOF_SUBMITTED';
ALTER TYPE "RegistrationPaymentStatus" ADD VALUE IF NOT EXISTS 'VERIFIED';
ALTER TYPE "RegistrationPaymentStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

CREATE TYPE "TournamentPaymentMethodType" AS ENUM (
  'INSTAPAY',
  'VODAFONE_CASH',
  'BANK_TRANSFER',
  'EXTERNAL_LINK',
  'OTHER'
);

CREATE TYPE "TournamentPaymentProofStatus" AS ENUM (
  'SUBMITTED',
  'VERIFIED',
  'REJECTED',
  'SUPERSEDED'
);

CREATE TABLE "tournament_payment_methods" (
  "id" TEXT NOT NULL,
  "tournamentId" TEXT NOT NULL,
  "type" "TournamentPaymentMethodType" NOT NULL,
  "displayName" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "accountHolderName" TEXT,
  "accountIdentifier" TEXT,
  "phoneNumber" TEXT,
  "instapayAddress" TEXT,
  "bankName" TEXT,
  "bankBranch" TEXT,
  "bankAccountNumber" TEXT,
  "iban" TEXT,
  "swiftCode" TEXT,
  "externalUrl" TEXT,
  "instructions" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tournament_payment_methods_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tournament_registration_payment_proofs" (
  "id" TEXT NOT NULL,
  "registrationId" TEXT NOT NULL,
  "paymentMethodId" TEXT NOT NULL,
  "status" "TournamentPaymentProofStatus" NOT NULL DEFAULT 'SUBMITTED',
  "expectedAmount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL,
  "proofUrl" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "transactionReference" TEXT,
  "paidAt" TIMESTAMP(3),
  "captainNote" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "verifiedAt" TIMESTAMP(3),
  "verifiedById" TEXT,
  "rejectedAt" TIMESTAMP(3),
  "rejectedById" TEXT,
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tournament_registration_payment_proofs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tournament_payment_methods_tournamentId_idx" ON "tournament_payment_methods"("tournamentId");
CREATE INDEX "tournament_payment_methods_enabled_idx" ON "tournament_payment_methods"("enabled");
CREATE INDEX "tournament_registration_payment_proofs_registrationId_idx" ON "tournament_registration_payment_proofs"("registrationId");
CREATE INDEX "tournament_registration_payment_proofs_paymentMethodId_idx" ON "tournament_registration_payment_proofs"("paymentMethodId");
CREATE INDEX "tournament_registration_payment_proofs_status_idx" ON "tournament_registration_payment_proofs"("status");

ALTER TABLE "tournament_payment_methods"
  ADD CONSTRAINT "tournament_payment_methods_tournamentId_fkey"
  FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tournament_registration_payment_proofs"
  ADD CONSTRAINT "tournament_registration_payment_proofs_registrationId_fkey"
  FOREIGN KEY ("registrationId") REFERENCES "tournament_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tournament_registration_payment_proofs"
  ADD CONSTRAINT "tournament_registration_payment_proofs_paymentMethodId_fkey"
  FOREIGN KEY ("paymentMethodId") REFERENCES "tournament_payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "tournament_registration_payment_proofs"
  ADD CONSTRAINT "tournament_registration_payment_proofs_verifiedById_fkey"
  FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "tournament_registration_payment_proofs"
  ADD CONSTRAINT "tournament_registration_payment_proofs_rejectedById_fkey"
  FOREIGN KEY ("rejectedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
