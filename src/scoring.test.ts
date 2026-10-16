import { describe, expect, it } from 'vitest';
import {
  cumulativeScores,
  isValidEntry,
  isValidRestkarten,
  isValidTischkarten,
  playerStats,
  ranking,
  roundPoints,
  totals,
} from './scoring';
import type { Game } from './types';

/** Kleines Testspiel: Runden als [tisch, rest]-Paare pro Spieler. */
function makeGame(players: string[], rounds: [number, number][][]): Game {
  return {
    players,
    rounds: rounds.map((round) => round.map(([tisch, rest]) => ({ tisch, rest }))),
    finished: false,
  };
}

const empty = makeGame(['Anna', 'Ben'], []);

// Anna: 12, 5     → 17   Ben: -4, 20 → 16   Cleo: 6, 6 → 12
const sample = makeGame(
  ['Anna', 'Ben', 'Cleo'],
  [
    [[12, 0], [6, 5], [10, 2]],
    [[9, 2], [20, 0], [8, 1]],
  ],
);

describe('roundPoints', () => {
  it('zählt Tischkarten positiv', () => {
    expect(roundPoints(12, 0)).toBe(12);
  });

  it('zieht pro Restkarte 2 Punkte ab', () => {
    expect(roundPoints(0, 10)).toBe(-20);
  });

  it('verrechnet beides', () => {
    expect(roundPoints(15, 3)).toBe(9);
  });
});

describe('Eingabeprüfung', () => {
  it('akzeptiert Tischkarten von 0 bis 40', () => {
    expect(isValidTischkarten(0)).toBe(true);
    expect(isValidTischkarten(40)).toBe(true);
    expect(isValidTischkarten(-1)).toBe(false);
    expect(isValidTischkarten(41)).toBe(false);
  });

  it('akzeptiert Restkarten von 0 bis 10', () => {
    expect(isValidRestkarten(0)).toBe(true);
    expect(isValidRestkarten(10)).toBe(true);
    expect(isValidRestkarten(-1)).toBe(false);
    expect(isValidRestkarten(11)).toBe(false);
  });

  it('lehnt Kommazahlen und NaN ab', () => {
    expect(isValidTischkarten(2.5)).toBe(false);
    expect(isValidRestkarten(NaN)).toBe(false);
  });

  it('prüft beide Werte eines Eintrags', () => {
    expect(isValidEntry({ tisch: 10, rest: 3 })).toBe(true);
    expect(isValidEntry({ tisch: 10, rest: 11 })).toBe(false);
    expect(isValidEntry({ tisch: 41, rest: 3 })).toBe(false);
  });
});

describe('totals', () => {
  it('ist 0 ohne Runden', () => {
    expect(totals(empty)).toEqual([0, 0]);
  });

  it('summiert alle Runden pro Spieler', () => {
    expect(totals(sample)).toEqual([17, 16, 12]);
  });
});

describe('cumulativeScores', () => {
  it('beginnt bei 0 und hat einen Wert pro Runde mehr', () => {
    expect(cumulativeScores(empty)).toEqual([[0], [0]]);
  });

  it('liefert den Zwischenstand nach jeder Runde', () => {
    expect(cumulativeScores(sample)).toEqual([
      [0, 12, 17],
      [0, -4, 16],
      [0, 6, 12],
    ]);
  });
});

describe('ranking', () => {
  it('sortiert nach Gesamtpunkten absteigend', () => {
    expect(ranking(sample)).toEqual([
      { player: 0, name: 'Anna', total: 17, place: 1 },
      { player: 1, name: 'Ben', total: 16, place: 2 },
      { player: 2, name: 'Cleo', total: 12, place: 3 },
    ]);
  });

  it('vergibt bei Gleichstand denselben Platz und überspringt den nächsten', () => {
    const game = makeGame(['Anna', 'Ben', 'Cleo'], [[[5, 0], [10, 0], [10, 0]]]);
    expect(ranking(game).map((s) => [s.name, s.place])).toEqual([
      ['Ben', 1],
      ['Cleo', 1],
      ['Anna', 3],
    ]);
  });

  it('teilt sich ohne Runden Platz 1', () => {
    expect(ranking(empty).map((s) => s.place)).toEqual([1, 1]);
  });
});

describe('playerStats', () => {
  it('ist null ohne Runden', () => {
    expect(playerStats(empty)).toEqual([null, null]);
  });

  it('berechnet die Kennzahlen pro Spieler', () => {
    const [anna, ben] = playerStats(sample);
    expect(anna).toEqual({
      bestRound: 12,
      worstRound: 5,
      mostTischkarten: 12,
      finishedRounds: 1,
      avgTischkarten: 10.5,
      avgRestkarten: 1,
    });
    expect(ben).toEqual({
      bestRound: 20,
      worstRound: -4,
      mostTischkarten: 20,
      finishedRounds: 1,
      avgTischkarten: 13,
      avgRestkarten: 2.5,
    });
  });

  it('zählt es für jeden, wenn mehrere in derselben Runde 0 Restkarten haben', () => {
    const game = makeGame(['Anna', 'Ben', 'Cleo'], [[[10, 0], [12, 0], [5, 4]]]);
    expect(playerStats(game).map((s) => s?.finishedRounds)).toEqual([1, 1, 0]);
  });

  it('zählt Runden ohne Restkarten', () => {
    const game = makeGame(['Anna'], [[[10, 0]], [[8, 0]], [[3, 4]]]);
    expect(playerStats(game)[0]?.finishedRounds).toBe(2);
  });
});
