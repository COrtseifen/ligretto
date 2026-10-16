type Props<K extends keyof HTMLElementTagNameMap> = Partial<HTMLElementTagNameMap[K]> &
  Record<`aria-${string}` | `data-${string}`, string>;

/**
 * Erzeugt ein HTML-Element mit Eigenschaften und Kindern, z. B.
 * `el('button', { className: 'btn', onclick: () => … }, 'Start')`.
 * Texte werden als Textknoten eingefügt – Spielernamen können so kein HTML einschleusen.
 */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<Props<K>> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('aria-') || key.startsWith('data-')) {
      element.setAttribute(key, String(value));
    } else {
      (element as unknown as Record<string, unknown>)[key] = value;
    }
  }
  element.append(...children);
  return element;
}
