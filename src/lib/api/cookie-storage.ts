// Cookie helpers for storing the JWT/role/name. Centralizes read/write/delete
// of small values in document.cookie with configurable persistence.

export type CookieExpiry = "session" | number; // number = days

const PATH = "/";

function buildExpires(expiry: CookieExpiry): string {
  if (expiry === "session") return "";
  const days = expiry;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  return `; expires=${date.toUTCString()}`;
}

export function setCookie(name: string, value: string, expiry: CookieExpiry): void {
  const encoded = encodeURIComponent(value);
  // SameSite=Lax keeps the cookie usable for API calls while protecting CSRF.
  // `Secure` is only added over HTTPS (or localhost) to avoid blocking http dev.
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  const flags = [
    `${name}=${encoded}`,
    `path=${PATH}`,
    `SameSite=Lax`,
    ...(secure ? ["Secure"] : []),
    buildExpires(expiry),
  ]
    .filter(Boolean)
    .join("; ");
  document.cookie = flags;
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const parts = document.cookie.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (part.startsWith(prefix)) {
      return decodeURIComponent(part.slice(prefix.length));
    }
  }
  return null;
}

export function deleteCookie(name: string): void {
  document.cookie = `${name}=; path=${PATH}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

/**
 * Reads a cookie value and JSON-parses it, returning fallback when absent/invalid.
 */
export function getCookieJson<T>(name: string): T | null {
  const raw = getCookie(name);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
