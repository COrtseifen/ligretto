// Rechenlogik für Ligretto – bewusst ohne Bezug zur Oberfläche, damit sie testbar bleibt.
import type { Entry, Game } from './types';

/** Punkte pro Tischkarte (in die Mitte abgelegt). */
export const POINTS_PER_TISCHKARTE = 1;
/** Punkte pro Restkarte (noch auf dem Ligretto-Stapel). */
export const POINTS_PER_RESTKARTE = -2;

/** Erlaubte Bereiche für die Eingaben (jeweils einschließlich). */
export const TISCH_MIN = 0;
export const TISCH_MAX = 40;
export const REST_MIN = 0;
export const REST_MAX = 10;

/** Rundenpunkte eines Spielers = Tischkarten − 2 × Restkarten. */
export function roundPoints(tischkarten: number, restkarten: number): number {
  return tischkarten * POINTS_PER_TISCHKARTE + restkarten * POINTS_PER_RESTKARTE;
}

function isIntInRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

export function isValidTischkarten(value: number): boolean {
  return isIntInRange(value, TISCH_MIN, TISCH_MAX);
}

export function isValidRestkarten(value: number): boolean {
  return isIntInRange(value, REST_MIN, REST_MAX);
}

export function isValidEntry(entry: Entry): boolean {
  return isValidTischkarten(entry.tisch) && isValidRestkarten(entry.rest);
}

/** Gesamtpunkte pro Spieler (Index wie `game.players`). */
export function totals(game: Game): number[] {
  return game.players.map((_, p) =>
    game.rounds.reduce((sum, round) => sum + roundPoints(round[p].tisch, round[p].rest), 0),
  );
}

/**
 * Punktestand pro Spieler nach jeder Runde, für das Verlaufsdiagramm.
 * Jede Reihe beginnt mit 0 (vor der ersten Runde) und hat daher `rounds.length + 1` Werte.
 */
export function cumulativeScores(game: Game): number[][] {
  return game.players.map((_, p) => {
    const series = [0];
    for (const round of game.rounds) {
      series.push(series[series.length - 1] + roundPoints(round[p].tisch, round[p].rest));
    }
    return series;
  });
}

export interface Standing {
  /** Index des Spielers in `game.players`. */
  player: number;
  name: string;
  total: number;
  /** Platz ab 1; bei Gleichstand teilen sich Spieler den Platz (1, 1, 3, …). */
  place: number;
}

/** Spieler nach Gesamtpunkten absteigend sortiert, mit Platzierung. */
export function ranking(game: Game): Standing[] {
  const sums = totals(game);
  const sorted = game.players
    .map((name, player) => ({ player, name, total: sums[player] }))
    .sort((a, b) => b.total - a.total);

  return sorted.map((s) => ({
    ...s,
    place: sorted.findIndex((other) => other.total === s.total) + 1,
  }));
}

export interface PlayerStats {
  /** Beste Runde (höchste Rundenpunkte). */
  bestRound: number;
  /** Schlechteste Runde (niedrigste Rundenpunkte). */
  worstRound: number;
  /** Meiste Tischkarten in einer Runde. */
  mostTischkarten: number;
  /** Runden, in denen der Spieler seinen Ligretto-Stapel leer hatte (Restkarten = 0). */
  finishedRounds: number;
  avgTischkarten: number;
  avgRestkarten: number;
}

/** Statistik pro Spieler (Index wie `game.players`); `null`, solange keine Runde gespielt ist. */
export function playerStats(game: Game): (PlayerStats | null)[] {
  return game.players.map((_, p) => {
    const entries = game.rounds.map((round) => round[p]);
    if (entries.length === 0) return null;

    const points = entries.map((e) => roundPoints(e.tisch, e.rest));
    const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

    return {
      bestRound: Math.max(...points),
      worstRound: Math.min(...points),
      mostTischkarten: Math.max(...entries.map((e) => e.tisch)),
      finishedRounds: entries.filter((e) => e.rest === 0).length,
      avgTischkarten: sum(entries.map((e) => e.tisch)) / entries.length,
      avgRestkarten: sum(entries.map((e) => e.rest)) / entries.length,
    };
  });
}
