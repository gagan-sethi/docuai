/**
 * API base URL helper.
 * In production, calls go to the external Express API server on AWS.
 * In development, falls back to a local API server or the same Next.js host.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "";
  
/**
 * Build a full API URL.
 * Usage: apiUrl("/api/auth/login") → "https://your-api.com/api/auth/login"
 */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
