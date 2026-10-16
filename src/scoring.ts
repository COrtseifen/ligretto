// Rechenlogik für Ligretto – bewusst ohne Bezug zur Oberfläche, damit sie testbar bleibt.

/** Punkte pro Tischkarte (in die Mitte abgelegt). */
export const POINTS_PER_TISCHKARTE = 1;
/** Punkte pro Restkarte (noch auf dem Ligretto-Stapel). */
export const POINTS_PER_RESTKARTE = -2;

/** Rundenpunkte eines Spielers = Tischkarten − 2 × Restkarten. */
export function roundPoints(tischkarten: number, restkarten: number): number {
  return tischkarten * POINTS_PER_TISCHKARTE + restkarten * POINTS_PER_RESTKARTE;
}
