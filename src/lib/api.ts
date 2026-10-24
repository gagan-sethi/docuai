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
 * Bearer-token session management.
 *
 * R3-25: Never persist raw session JWT in permanent localStorage.
 * Tokens are kept in memory and tab-scoped sessionStorage (which terminates
 * when the tab/window is closed). The server sets an HttpOnly cookie
 * for secure credentialed calls across requests.
 */
const AUTH_TOKEN_KEY = "docuai_auth_token"; // legacy key purged on load
const AUTH_SESSION_KEY = "docuai_session_token";

let inMemoryAuthToken: string | null = null;

export function setAuthToken(token: string | undefined | null): void {
  inMemoryAuthToken = token || null;
  if (typeof window === "undefined") return;
  try {
    // Purge legacy persistent localStorage token to prevent script exfiltration
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    if (token) {
      window.sessionStorage.setItem(AUTH_SESSION_KEY, token);
    } else {
      window.sessionStorage.removeItem(AUTH_SESSION_KEY);
    }
  } catch {
    /* storage unavailable in private mode quota — in-memory and cookie auth still applies */
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return inMemoryAuthToken;
  try {
    // 1. If an impersonate_token is in the URL, pick it up synchronously
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("impersonate_token");
    if (urlToken) {
      inMemoryAuthToken = urlToken;
      try {
        window.sessionStorage.setItem(AUTH_SESSION_KEY, urlToken);
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
      } catch {}
      return urlToken;
    }

    // 2. Return in-memory token if active
    if (inMemoryAuthToken) return inMemoryAuthToken;

    // 3. Fallback to tab-scoped sessionStorage
    const sessionToken = window.sessionStorage.getItem(AUTH_SESSION_KEY);
    if (sessionToken) {
      inMemoryAuthToken = sessionToken;
      return sessionToken;
    }

    // 4. Ensure legacy plain localStorage key is purged
    if (window.localStorage.getItem(AUTH_TOKEN_KEY)) {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
    }
    return null;
  } catch {
    return inMemoryAuthToken;
  }
}

/**
 * Extract authenticated user ID or identifier from JWT payload.
 * Used for client-side storage isolation so User B never sees User A's data.
 */
export function getAuthenticatedUserId(): string | null {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length >= 2) {
      const payload = JSON.parse(atob(parts[1]));
      return payload.userId || payload.id || payload.sub || payload.email || null;
    }
  } catch {
    // ignore decoding errors
  }
  return null;
}

export function clearAuthToken(): void {
  inMemoryAuthToken = null;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(AUTH_SESSION_KEY);
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    document.cookie = "docuai_token=; path=/; max-age=0; SameSite=Lax";
    // Purge any upload batch keys and cached items so they do not leak across users
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (
        key &&
        (key.startsWith("docuai.uploadBatches") ||
          key.startsWith("docuai_") ||
          key === "docuai.uploadBatches")
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => window.localStorage.removeItem(k));
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
