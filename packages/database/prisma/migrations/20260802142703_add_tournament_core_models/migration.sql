-- CreateEnum
CREATE TYPE "TournamentMode" AS ENUM ('ONLINE', 'ONSITE');

-- CreateEnum
CREATE TYPE "TournamentVisibility" AS ENUM ('PUBLIC', 'UNLISTED', 'PRIVATE');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'CHECK_IN_OPEN', 'IN_PROGRESS', 'COMPLETED', 'POSTPONED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TournamentFormat" AS ENUM ('SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN', 'GROUPS_THEN_PLAYOFFS', 'SWISS', 'BATTLE_ROYALE');

-- CreateEnum
CREATE TYPE "TournamentSeedingMethod" AS ENUM ('MANUAL', 'RANDOM', 'RANKED');

-- CreateEnum
CREATE TYPE "GamingRoomPurpose" AS ENUM ('COMPETITION', 'PRACTICE', 'WARMUP', 'FINAL_STAGE', 'BACKUP');

-- CreateTable
CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT,
    "description" TEXT,
    "logoUrl" TEXT,
    "coverUrl" TEXT,
    "gameKey" TEXT NOT NULL,
    "mode" "TournamentMode" NOT NULL,
    "visibility" "TournamentVisibility" NOT NULL DEFAULT 'PUBLIC',
    "status" "TournamentStatus" NOT NULL DEFAULT 'DRAFT',
    "format" "TournamentFormat" NOT NULL,
    "minimumTeams" INTEGER NOT NULL,
    "maximumTeams" INTEGER NOT NULL,
    "minimumStarters" INTEGER NOT NULL,
    "maximumStarters" INTEGER NOT NULL,
    "maximumSubstitutes" INTEGER NOT NULL DEFAULT 0,
    "defaultBestOf" INTEGER NOT NULL DEFAULT 1,
    "finalBestOf" INTEGER NOT NULL DEFAULT 3,
    "seedingMethod" "TournamentSeedingMethod" NOT NULL DEFAULT 'MANUAL',
    "thirdPlaceMatch" BOOLEAN NOT NULL DEFAULT false,
    "requiredGameAccountId" BOOLEAN NOT NULL DEFAULT true,
    "allowedRegion" TEXT,
    "allowedCountries" TEXT[],
    "allowedPlatforms" TEXT[],
    "minimumPlayerAge" INTEGER,
    "minimumRank" TEXT,
    "maximumRank" TEXT,
    "registrationFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "prizePool" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "prizeDistribution" JSONB,
    "refundPolicy" TEXT,
    "cancellationPolicy" TEXT,
    "rules" TEXT NOT NULL,
    "rulesVersion" TEXT NOT NULL DEFAULT '1.0',
    "rosterChangeRules" TEXT,
    "checkInRules" TEXT,
    "matchReportingRules" TEXT,
    "evidenceRequirements" TEXT,
    "disputeDeadlineMinutes" INTEGER,
    "forfeitRules" TEXT,
    "codeOfConduct" TEXT,
    "registrationOpensAt" TIMESTAMP(3) NOT NULL,
    "registrationClosesAt" TIMESTAMP(3) NOT NULL,
    "rosterLocksAt" TIMESTAMP(3),
    "checkInOpensAt" TIMESTAMP(3),
    "checkInClosesAt" TIMESTAMP(3),
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Cairo',
    "waitlistEnabled" BOOLEAN NOT NULL DEFAULT false,
    "maximumWaitlistSize" INTEGER,
    "manualApprovalRequired" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "registrationOpenedAt" TIMESTAMP(3),
    "registrationClosedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_online_configurations" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "serverRegion" TEXT NOT NULL,
    "publicInstructions" TEXT,
    "connectionRules" TEXT,
    "evidenceRequired" BOOLEAN NOT NULL DEFAULT false,
    "screenshotRequirements" TEXT,
    "resultSubmissionDeadlineMinutes" INTEGER,
    "discordServerUrl" TEXT,
    "captainSupportChannel" TEXT,
    "matchReportingChannel" TEXT,
    "lobbyInstructions" TEXT,
    "privateSupportContact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_online_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_venues" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "mapUrl" TEXT,
    "checkInLocation" TEXT NOT NULL,
    "parkingInfo" TEXT,
    "spectatorPolicy" TEXT,
    "venueRules" TEXT,
    "emergencyContact" TEXT,
    "equipmentProvided" JSONB,
    "playersMayBring" JSONB,
    "playersMustBring" JSONB,
    "personalPeripheralsAllowed" BOOLEAN NOT NULL DEFAULT false,
    "controllersAllowed" BOOLEAN NOT NULL DEFAULT false,
    "usbDevicesAllowed" BOOLEAN NOT NULL DEFAULT false,
    "driverInstallationAllowed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_gaming_rooms" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "purpose" "GamingRoomPurpose" NOT NULL,
    "stationCount" INTEGER NOT NULL,
    "cpu" TEXT NOT NULL,
    "gpu" TEXT NOT NULL,
    "ram" TEXT,
    "storage" TEXT,
    "operatingSystem" TEXT,
    "monitorBrand" TEXT,
    "monitorModel" TEXT NOT NULL,
    "monitorSizeInches" DECIMAL(4,1),
    "monitorResolution" TEXT,
    "monitorRefreshRateHz" INTEGER NOT NULL,
    "monitorResponseTimeMs" DECIMAL(4,1),
    "mouse" TEXT NOT NULL,
    "keyboard" TEXT NOT NULL,
    "headset" TEXT NOT NULL,
    "mousePad" TEXT,
    "controller" TEXT,
    "internetConnection" TEXT,
    "equipmentNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_gaming_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tournaments_slug_key" ON "tournaments"("slug");

-- CreateIndex
CREATE INDEX "tournaments_organizerId_idx" ON "tournaments"("organizerId");

-- CreateIndex
CREATE INDEX "tournaments_status_idx" ON "tournaments"("status");

-- CreateIndex
CREATE INDEX "tournaments_gameKey_idx" ON "tournaments"("gameKey");

-- CreateIndex
CREATE INDEX "tournaments_mode_idx" ON "tournaments"("mode");

-- CreateIndex
CREATE INDEX "tournaments_visibility_idx" ON "tournaments"("visibility");

-- CreateIndex
CREATE INDEX "tournaments_startsAt_idx" ON "tournaments"("startsAt");

-- CreateIndex
CREATE INDEX "tournaments_registrationClosesAt_idx" ON "tournaments"("registrationClosesAt");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_online_configurations_tournamentId_key" ON "tournament_online_configurations"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_venues_tournamentId_key" ON "tournament_venues"("tournamentId");

-- CreateIndex
CREATE INDEX "tournament_gaming_rooms_venueId_idx" ON "tournament_gaming_rooms"("venueId");

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_online_configurations" ADD CONSTRAINT "tournament_online_configurations_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_venues" ADD CONSTRAINT "tournament_venues_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_gaming_rooms" ADD CONSTRAINT "tournament_gaming_rooms_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "tournament_venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
