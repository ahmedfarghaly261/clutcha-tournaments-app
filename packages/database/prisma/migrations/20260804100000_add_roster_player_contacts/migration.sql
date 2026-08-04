-- AlterTable
ALTER TABLE "roster_players"
DROP COLUMN "playerRole",
ADD COLUMN "phoneNumber" TEXT NOT NULL DEFAULT '+10000000000',
ADD COLUMN "email" TEXT,
ADD COLUMN "discordUsername" TEXT;

-- Remove temporary backfill default so new roster players must provide a phone number.
ALTER TABLE "roster_players"
ALTER COLUMN "phoneNumber" DROP DEFAULT;
