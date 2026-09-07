// Authenticated-state helpers.
//
// The JWT itself now lives in an HttpOnly cookie ("eray_token") set by the
// Symfony backend on login — JavaScript cannot read it (which is the point:
// it's not exposed to XSS). The browser sends it automatically on every
// request via credentials: "include".
//
// For the UI we need to know "am I logged in" and "which role/name". The
// backend mirrors those into three JS-readable cookies (eray_auth, eray_role,
// eray_name) whose lifetime matches the JWT's, so this module just reads them.

import { getCookie, deleteCookie } from "./cookie-storage";

const AUTH_COOKIE = "eray_auth";
const ROLE_COOKIE = "eray_role";
const NAME_COOKIE = "eray_name";

export function clearSession(): void {
  // The real auth cookies (incl. the HttpOnly token) are cleared by the
  // backend's /api/auth/logout. We also clear the JS mirrors here so the UI
  // reflects the logged-out state immediately.
  deleteCookie(AUTH_COOKIE);
  deleteCookie(ROLE_COOKIE);
  deleteCookie(NAME_COOKIE);
}

// The token is not readable from JavaScript (HttpOnly). Keeping a getToken()
// for backward-compat with call sites, but it always returns null.
export function getToken(): string | null {
  return null;
}

export function getRole(): string | null {
  const val = getCookie(ROLE_COOKIE);
  return val && val !== "undefined" ? val : null;
}

export function getName(): string | null {
  const val = getCookie(NAME_COOKIE);
  return val && val !== "undefined" ? val : null;
}

export function isAuthenticated(): boolean {
  return getCookie(AUTH_COOKIE) === "1";
}
