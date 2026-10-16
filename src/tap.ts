/**
 * Erkennt schnelles Mehrfach-Tippen: Die zurückgegebene Funktion wird bei jedem Tipp
 * mit der aktuellen Zeit (ms) aufgerufen und liefert `true`, sobald `required` Tipps
 * innerhalb von `windowMs` erfolgt sind. Danach beginnt die Zählung von vorn.
 */
export function createTapDetector(required: number, windowMs: number): (now: number) => boolean {
  let taps: number[] = [];
  return (now) => {
    taps = [...taps.filter((t) => now - t < windowMs), now];
    if (taps.length < required) return false;
    taps = [];
    return true;
  };
}
