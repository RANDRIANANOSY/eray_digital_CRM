// Single source of truth for where the JWT/role/name live (localStorage when
// "remember me" was checked, sessionStorage otherwise). Centralizing this
// fixes the previous inconsistency where logout cleared token/role but not name.

const KEYS = ["token", "role", "name"] as const;

function store(remember: boolean): Storage {
  return remember ? localStorage : sessionStorage;
}

export function saveSession(token: string, role: string, name: string, remember: boolean): void {
  const target = store(remember);
  target.setItem("token", token);
  target.setItem("role", role);
  target.setItem("name", name);
}

export function clearSession(): void {
  for (const key of KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}

export function getToken(): string | null {
  return localStorage.getItem("token") ?? sessionStorage.getItem("token");
}

export function getRole(): string | null {
  return localStorage.getItem("role") ?? sessionStorage.getItem("role");
}

export function getName(): string | null {
  return localStorage.getItem("name") ?? sessionStorage.getItem("name");
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}
