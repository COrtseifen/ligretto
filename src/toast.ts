// Kurzer Hinweis oben am Bildschirm, optional mit Aktion („Rückgängig"). Verschwindet von selbst.
// Hängt direkt am <body>, damit er einen Bildschirmwechsel (render()) übersteht.
import { el } from './dom';

let current: { node: HTMLElement; timer: number } | null = null;

export interface ToastOptions {
  message: string;
  actionLabel?: string;
  onAction?(): void;
  /** Anzeigedauer in Millisekunden. */
  duration?: number;
}

export function showToast({ message, actionLabel, onAction, duration = 6000 }: ToastOptions): void {
  hideToast();

  const node = el('div', { className: 'toast', role: 'status' }, el('span', {}, message));
  if (actionLabel && onAction) {
    const action = el('button', { type: 'button', className: 'toast-action' }, actionLabel);
    action.addEventListener('click', () => {
      hideToast();
      onAction();
    });
    node.append(action);
  }

  document.body.append(node);
  current = { node, timer: window.setTimeout(hideToast, duration) };
}

export function hideToast(): void {
  if (!current) return;
  clearTimeout(current.timer);
  current.node.remove();
  current = null;
}
