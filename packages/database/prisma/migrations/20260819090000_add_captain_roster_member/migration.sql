ALTER TABLE "roster_players"
ADD COLUMN "captain_user_id" TEXT;

CREATE UNIQUE INDEX "roster_players_captain_user_id_key"
ON "roster_players"("captain_user_id");

ALTER TABLE "roster_players"
ADD CONSTRAINT "roster_players_captain_user_id_fkey"
FOREIGN KEY ("captain_user_id") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
