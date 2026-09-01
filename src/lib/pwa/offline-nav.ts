import type { MouseEvent } from "react";

/** Use full page load from SW cache when offline (Next client nav needs network). */
export function offlineNavigate(href: string, event?: MouseEvent<HTMLAnchorElement>): void {
  if (typeof window === "undefined" || navigator.onLine) return;
  event?.preventDefault();
  window.location.assign(href);
}
