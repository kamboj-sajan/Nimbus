const trim = (url: string | undefined) => (url ?? "").replace(/\/+$/, "");

/**
 * In production everything sits behind one ingress, so both URLs can be left empty and
 * requests go to the page's own origin. In development they point at the local services.
 */
export const env = {
  apiUrl: trim(import.meta.env.VITE_API_URL ?? "http://localhost:3001"),
  orchestratorUrl: trim(import.meta.env.VITE_ORCHESTRATOR_URL ?? "http://localhost:3002"),
  autosaveDelayMs: Number(import.meta.env.VITE_AUTOSAVE_DELAY_MS ?? 1200),
};

/** Socket.IO needs an absolute origin; fall back to the page origin for same-origin deploys. */
export function absoluteOrigin(url: string): string {
  return url || window.location.origin;
}
