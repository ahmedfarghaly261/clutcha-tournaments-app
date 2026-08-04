-- CreateEnum
CREATE TYPE "TournamentRegistrationStatus" AS ENUM ('PENDING_PAYMENT', 'PENDING_APPROVAL', 'CONFIRMED', 'REJECTED', 'WAITLISTED', 'WITHDRAWN', 'CHECKED_IN', 'DISQUALIFIED', 'REFUND_PENDING', 'REFUNDED');

-- CreateEnum
CREATE TYPE "RegistrationPaymentStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'PAID', 'FAILED', 'REFUND_PENDING', 'REFUNDED');

-- CreateEnum
CREATE TYPE "RegistrationApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "tournament_registrations" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "captainId" TEXT NOT NULL,
    "status" "TournamentRegistrationStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "paymentStatus" "RegistrationPaymentStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "approvalStatus" "RegistrationApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "rosterSnapshot" JSONB NOT NULL,
    "captainContactSnapshot" JSONB NOT NULL,
    "rulesVersion" TEXT NOT NULL,
    "rulesAcceptedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "withdrawnAt" TIMESTAMP(3),
    "checkedInAt" TIMESTAMP(3),
    "disqualifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tournament_registrations_captainId_idx" ON "tournament_registrations"("captainId");

-- CreateIndex
CREATE INDEX "tournament_registrations_tournamentId_idx" ON "tournament_registrations"("tournamentId");

-- CreateIndex
CREATE INDEX "tournament_registrations_status_idx" ON "tournament_registrations"("status");

-- CreateIndex
CREATE INDEX "tournament_registrations_approvalStatus_idx" ON "tournament_registrations"("approvalStatus");

-- CreateIndex
CREATE INDEX "tournament_registrations_paymentStatus_idx" ON "tournament_registrations"("paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_registrations_tournamentId_teamId_key" ON "tournament_registrations"("tournamentId", "teamId");

-- AddForeignKey
ALTER TABLE "tournament_registrations" ADD CONSTRAINT "tournament_registrations_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_registrations" ADD CONSTRAINT "tournament_registrations_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_registrations" ADD CONSTRAINT "tournament_registrations_captainId_fkey" FOREIGN KEY ("captainId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
