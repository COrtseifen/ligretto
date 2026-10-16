// Mathematik fürs Diagramm, ohne Bezug zum Zeichnen – damit testbar.

/**
 * „Schöne" Achsenwerte (Schritte 1, 2, 5, 10, 20, 50, …), die `min` und `max` einschließen.
 * Liefert höchstens etwa `maxTicks` Werte, aufsteigend.
 */
export function niceTicks(min: number, max: number, maxTicks = 5): number[] {
  if (min === max) {
    // Flache Linie: etwas Luft drumherum, damit die Achse nicht zusammenfällt.
    min -= 1;
    max += 1;
  }
  const rawStep = (max - min) / Math.max(1, maxTicks - 1);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  // Mindestens 1 – Punkte sind ganze Zahlen, halbe Schritte wären sinnlos.
  const step = Math.max(1, [1, 2, 5, 10].map((f) => f * magnitude).find((s) => s >= rawStep)!);

  const ticks: number[] = [];
  for (let t = Math.floor(min / step) * step; t <= Math.ceil(max / step) * step + step / 2; t += step) {
    ticks.push(Math.round(t / step) * step + 0); // „+ 0" macht aus −0 eine 0
  }
  return ticks;
}

/** Lineare Abbildung eines Wertebereichs auf einen Pixelbereich. */
export function linearScale(domain: [number, number], range: [number, number]): (value: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const factor = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  return (value) => r0 + (value - d0) * factor;
}

/** Jede wievielte Runde auf der x-Achse beschriftet wird, damit sich Beschriftungen nicht überlappen. */
export function labelEvery(count: number, availablePx: number, minGapPx = 28): number {
  if (count <= 1) return 1;
  const spacing = availablePx / count;
  const candidates = [1, 2, 5, 10, 20, 50];
  return candidates.find((c) => c * spacing >= minGapPx) ?? candidates[candidates.length - 1];
}

/** Ob nebeneinander stehende Beschriftungen (y-Positionen) sich überlappen würden. */
export function labelsCollide(positions: number[], minGapPx: number): boolean {
  const sorted = [...positions].sort((a, b) => a - b);
  return sorted.some((y, i) => i > 0 && y - sorted[i - 1] < minGapPx);
}
