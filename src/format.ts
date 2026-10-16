// Zahlenformate für die Anzeige.

/** Mit Vorzeichen: „+9", „−4", „0" (echtes Minuszeichen statt Bindestrich). */
export function formatSigned(n: number): string {
  return n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0';
}

/** Ganze Zahl mit echtem Minuszeichen: „17", „−4". */
export function formatInt(n: number): string {
  return n < 0 ? `−${-n}` : String(n);
}

/** Deutsche Kommazahl mit höchstens einer Nachkommastelle: „10,5", „2". */
export function formatDecimal(n: number): string {
  return n.toLocaleString('de-DE', { maximumFractionDigits: 1 }).replace('-', '−');
}
