/** Eingaben eines Spielers für eine Runde. */
export interface Entry {
  /** In die Mitte abgelegte Karten (je +1). */
  tisch: number;
  /** Karten, die noch auf dem Ligretto-Stapel liegen (je −2). */
  rest: number;
}

/** Eine Runde: ein Eintrag pro Spieler, in derselben Reihenfolge wie `Game.players`. */
export type Round = Entry[];

export interface Game {
  players: string[];
  rounds: Round[];
  finished: boolean;
}
