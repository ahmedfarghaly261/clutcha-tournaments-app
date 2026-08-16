export type GeneratedBracketMatch = {
  stage: string;
  round: number;
  bracketPosition: string;
  bestOf: number;
  teamAId: string | null;
  teamBId: string | null;
};

export type GeneratedSingleEliminationBracket = {
  bracketSize: number;
  matches: GeneratedBracketMatch[];
};

export function getSingleEliminationBracketSize(teamCount: number): number {
  if (teamCount < 2) return 0;

  let bracketSize = 2;
  while (bracketSize < teamCount) bracketSize *= 2;
  return bracketSize;
}

export function generateSingleEliminationBracket(
  orderedTeamIds: string[],
  defaultBestOf: number,
  finalBestOf: number,
  includeThirdPlaceMatch = false,
): GeneratedSingleEliminationBracket {
  const bracketSize = getSingleEliminationBracketSize(orderedTeamIds.length);
  if (bracketSize === 0) return { bracketSize, matches: [] };

  const seedPositions = buildSeedPositions(bracketSize);
  const firstRoundSlots = seedPositions.map(
    (seed) => orderedTeamIds[seed - 1] ?? null,
  );
  const totalRounds = Math.log2(bracketSize);
  const matches: GeneratedBracketMatch[] = [];

  for (let round = 1; round <= totalRounds; round += 1) {
    const matchesInRound = bracketSize / 2 ** round;
    for (let matchIndex = 0; matchIndex < matchesInRound; matchIndex += 1) {
      matches.push({
        stage: 'MAIN_BRACKET',
        round,
        bracketPosition: `R${round}-M${matchIndex + 1}`,
        bestOf: round === totalRounds ? finalBestOf : defaultBestOf,
        teamAId: round === 1 ? firstRoundSlots[matchIndex * 2] : null,
        teamBId: round === 1 ? firstRoundSlots[matchIndex * 2 + 1] : null,
      });
    }
  }

  if (includeThirdPlaceMatch && totalRounds >= 2) {
    matches.push({
      stage: 'THIRD_PLACE',
      round: totalRounds,
      bracketPosition: 'THIRD-PLACE',
      bestOf: finalBestOf,
      teamAId: null,
      teamBId: null,
    });
  }

  return { bracketSize, matches };
}

function buildSeedPositions(bracketSize: number): number[] {
  let positions = [1, 2];
  let currentSize = 2;

  while (currentSize < bracketSize) {
    const nextSize = currentSize * 2;
    const pairSum = nextSize + 1;
    positions = positions.flatMap((seed) => [seed, pairSum - seed]);
    currentSize = nextSize;
  }

  return positions;
}
