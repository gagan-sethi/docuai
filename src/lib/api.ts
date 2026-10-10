/**
 * API base URL helper.
 * In production, calls go to the external Express API server on AWS.
 * In development, falls back to a local API server or the same Next.js host.
 */
const CONFIGURED_API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "";

/**
 * Fail loudly when the API host is missing from a production build.
 *
 * NEXT_PUBLIC_* values are inlined at build time. With this unset the base
 * URL compiled to "", every apiUrl() produced a same-origin path, and the
 * portal quietly 404'd against its own domain instead of reaching the API —
 * a silent failure that looks like a broken backend.
 *
 * The throw is server-side only, so it surfaces during `next build` and
 * fails the deployment rather than white-screening a visitor's browser.
 * In the browser we log instead, which keeps an already-deployed app usable
 * while still making the cause obvious in the console.
 */
if (process.env.NODE_ENV === "production" && !CONFIGURED_API_URL) {
  const message =
    "NEXT_PUBLIC_API_URL is not set. API calls would resolve against this " +
    "app's own origin and return 404. Set it in the deployment environment " +
    "and rebuild — it is read at build time, not at runtime.";
  if (typeof window === "undefined") throw new Error(message);
  console.error(`[api] ${message}`);
}

export const API_BASE_URL = CONFIGURED_API_URL;
/**
 * Build a full API URL.
 * Usage: apiUrl("/api/auth/login") → "https://your-api.com/api/auth/login"
 */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

/**
 * Bearer-token persistence.
 *
 * The API authenticates with an httpOnly cookie set on the API's own domain
 * (SameSite=None). Because the app and the API live on different sites,
 * browsers that block third-party cookies (Safari ITP, Chrome Incognito,
 * privacy modes) silently drop that cookie and every request returns 401
 * even though the user just logged in. The login/signup responses already
 * include the same JWT in their JSON body, and the API accepts it via the
 * Authorization header — so we persist it and send it on every call as a
 * cookie-independent fallback.
 */
const AUTH_TOKEN_KEY = "docuai_auth_token";

export function setAuthToken(token: string | undefined | null): void {
  if (typeof window === "undefined" || !token) return;
  try {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch { /* storage unavailable (private mode quota) — cookie auth still applies */ }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    // If an impersonate_token is in the URL, pick it up synchronously before any component fetch fires!
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("impersonate_token");
    if (urlToken) {
      window.localStorage.setItem(AUTH_TOKEN_KEY, urlToken);
      return urlToken;
    }
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch { /* ignore */ }
}

/**
 * fetch() with credentials and the Bearer fallback attached.
 * Same signature as fetch so call sites can switch mechanically.
 */
export function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(init.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(input, {
    credentials: "include",
    ...init,
    headers,
  });
}

/**
 * Download an authenticated file (exports, Excel views).
 * window.open() cannot carry the Authorization header, so cookie-blocked
 * browsers received 401 pages instead of files. Fetch the blob with auth
 * and trigger the download from an object URL instead.
 */
export async function downloadApiFile(url: string, fallbackName = "download"): Promise<void> {
  const res = await apiFetch(url);
  if (await handleUnauthorized(res)) return;
  if (!res.ok) throw new Error(`Download failed (${res.status})`);

  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const fileName = match?.[1] || fallbackName;

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export const handleUnauthorized = async (res: Response) => {
  if (res.status === 401) {
    clearAuthToken();
    try {
      await apiFetch(apiUrl("/api/auth/logout"), {
        method: "POST",
        credentials: "include",
      });
    } catch {}

    window.location.href = "/login";
    return true;
  }

  return false;
};
