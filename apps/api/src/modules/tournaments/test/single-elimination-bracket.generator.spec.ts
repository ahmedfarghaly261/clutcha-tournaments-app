import {
  generateSingleEliminationBracket,
  getSingleEliminationBracketSize,
} from '../services/single-elimination-bracket.generator';

describe('single-elimination bracket generator', () => {
  it('uses the next power of two for bracket capacity', () => {
    expect(getSingleEliminationBracketSize(2)).toBe(2);
    expect(getSingleEliminationBracketSize(6)).toBe(8);
    expect(getSingleEliminationBracketSize(9)).toBe(16);
  });

  it('creates seeded rounds and leaves empty slots as byes', () => {
    const result = generateSingleEliminationBracket(
      ['team-1', 'team-2', 'team-3'],
      1,
      3,
    );

    expect(result.bracketSize).toBe(4);
    expect(result.matches).toEqual([
      expect.objectContaining({
        bracketPosition: 'R1-M1',
        teamAId: 'team-1',
        teamBId: null,
        bestOf: 1,
      }),
      expect.objectContaining({
        bracketPosition: 'R1-M2',
        teamAId: 'team-2',
        teamBId: 'team-3',
        bestOf: 1,
      }),
      expect.objectContaining({
        bracketPosition: 'R2-M1',
        teamAId: null,
        teamBId: null,
        bestOf: 3,
      }),
    ]);
  });
});
