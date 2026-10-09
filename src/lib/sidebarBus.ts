/**
 * Tiny event bus for the dashboard sidebar drawer.
 *
 * Below 1024px the sidebar is an off-canvas drawer opened from the TopBar
 * hamburger. The two components are rendered independently by ~18 dashboard
 * pages, so a window event is used rather than threading a context provider
 * through every one of them.
 */

export const SIDEBAR_TOGGLE_EVENT = "invonix:sidebar-toggle";

/** Media query below which the sidebar becomes an off-canvas drawer. */
export const MOBILE_SIDEBAR_QUERY = "(max-width: 1023px)";

export function toggleSidebar(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SIDEBAR_TOGGLE_EVENT));
}

export function onSidebarToggle(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(SIDEBAR_TOGGLE_EVENT, handler);
  return () => window.removeEventListener(SIDEBAR_TOGGLE_EVENT, handler);
}
