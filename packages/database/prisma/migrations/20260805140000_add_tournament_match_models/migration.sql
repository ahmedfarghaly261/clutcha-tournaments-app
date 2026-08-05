-- CreateEnum
CREATE TYPE "TournamentMatchStatus" AS ENUM ('SCHEDULED', 'LIVE', 'COMPLETED', 'POSTPONED', 'CANCELLED', 'FORFEIT');

-- CreateEnum
CREATE TYPE "TournamentMatchOfficialResultStatus" AS ENUM ('PENDING', 'CONFIRMED', 'OVERTURNED');

-- CreateEnum
CREATE TYPE "TournamentMatchForfeitStatus" AS ENUM ('NONE', 'TEAM_A', 'TEAM_B', 'BOTH');

-- CreateEnum
CREATE TYPE "TournamentMatchDisputeStatus" AS ENUM ('NONE', 'OPEN', 'RESOLVED', 'REJECTED');

-- CreateTable
CREATE TABLE "tournament_matches" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "bracketPosition" TEXT,
    "bestOf" INTEGER NOT NULL DEFAULT 1,
    "scheduledAt" TIMESTAMP(3),
    "teamAId" TEXT,
    "teamBId" TEXT,
    "winnerTeamId" TEXT,
    "status" "TournamentMatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "teamAScore" INTEGER,
    "teamBScore" INTEGER,
    "forfeitStatus" "TournamentMatchForfeitStatus" NOT NULL DEFAULT 'NONE',
    "officialResultStatus" "TournamentMatchOfficialResultStatus" NOT NULL DEFAULT 'PENDING',
    "disputeStatus" "TournamentMatchDisputeStatus" NOT NULL DEFAULT 'NONE',
    "evidenceUrl" TEXT,
    "onlineServerInfo" JSONB,
    "gamingRoomId" TEXT,
    "onsiteStationLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_match_games" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "gameNumber" INTEGER NOT NULL,
    "mapName" TEXT,
    "teamAScore" INTEGER,
    "teamBScore" INTEGER,
    "winnerTeamId" TEXT,
    "evidenceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_match_games_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tournament_matches_tournamentId_idx" ON "tournament_matches"("tournamentId");

-- CreateIndex
CREATE INDEX "tournament_matches_teamAId_idx" ON "tournament_matches"("teamAId");

-- CreateIndex
CREATE INDEX "tournament_matches_teamBId_idx" ON "tournament_matches"("teamBId");

-- CreateIndex
CREATE INDEX "tournament_matches_winnerTeamId_idx" ON "tournament_matches"("winnerTeamId");

-- CreateIndex
CREATE INDEX "tournament_matches_status_idx" ON "tournament_matches"("status");

-- CreateIndex
CREATE INDEX "tournament_matches_scheduledAt_idx" ON "tournament_matches"("scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_match_games_matchId_gameNumber_key" ON "tournament_match_games"("matchId", "gameNumber");

-- CreateIndex
CREATE INDEX "tournament_match_games_matchId_idx" ON "tournament_match_games"("matchId");

-- CreateIndex
CREATE INDEX "tournament_match_games_winnerTeamId_idx" ON "tournament_match_games"("winnerTeamId");

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_teamAId_fkey" FOREIGN KEY ("teamAId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_teamBId_fkey" FOREIGN KEY ("teamBId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_winnerTeamId_fkey" FOREIGN KEY ("winnerTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_gamingRoomId_fkey" FOREIGN KEY ("gamingRoomId") REFERENCES "tournament_gaming_rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_match_games" ADD CONSTRAINT "tournament_match_games_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "tournament_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_match_games" ADD CONSTRAINT "tournament_match_games_winnerTeamId_fkey" FOREIGN KEY ("winnerTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
