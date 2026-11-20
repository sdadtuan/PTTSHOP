/** Prefer typing fields when a dialog opens (not the header close button). */
export function pickInitialModalFocus(panel: HTMLElement | null): HTMLElement | null {
  if (!panel) return null;
  const typing = panel.querySelector<HTMLElement>(
    'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])',
  );
  if (typing) return typing;
  return panel.querySelector<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );
}