import type { MouseEvent } from "react";

export function followInternalLink(event: MouseEvent<HTMLAnchorElement>, onNavigate: () => void): void {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  onNavigate();
}
