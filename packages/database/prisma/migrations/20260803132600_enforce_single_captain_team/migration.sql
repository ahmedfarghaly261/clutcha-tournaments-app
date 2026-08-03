-- AlterTable
ALTER TABLE "teams"
ADD COLUMN "coverUrl" TEXT,
ADD COLUMN "description" TEXT,
ADD COLUMN "discordServerUrl" TEXT;

-- DropIndex
DROP INDEX "teams_captainId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "teams_captainId_key" ON "teams"("captainId");
