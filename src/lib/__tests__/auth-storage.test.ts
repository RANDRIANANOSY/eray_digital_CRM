import { describe, it, expect, beforeEach } from "vitest";
import { setCookie } from "../api/cookie-storage";
import { isAuthenticated, getRole, getName, getToken, clearSession } from "../api/auth-storage";

describe("auth-storage", () => {
  beforeEach(() => {
    clearSession();
  });

  it("should return false for isAuthenticated when cookie absent", () => {
    expect(isAuthenticated()).toBe(false);
  });

  it("should return true for isAuthenticated when eray_auth cookie is 1", () => {
    setCookie("eray_auth", "1", "session");
    expect(isAuthenticated()).toBe(true);
  });

  it("should return role from cookie", () => {
    setCookie("eray_role", "admin", "session");
    expect(getRole()).toBe("admin");
  });

  it("should return name from cookie", () => {
    setCookie("eray_name", "Adem Eray", "session");
    expect(getName()).toBe("Adem Eray");
  });

  it("should return null for getToken (backward compat)", () => {
    expect(getToken()).toBeNull();
  });

  it("should clear session cookies on clearSession()", () => {
    setCookie("eray_auth", "1", "session");
    setCookie("eray_role", "admin", "session");
    setCookie("eray_name", "Adem Eray", "session");

    clearSession();

    expect(isAuthenticated()).toBe(false);
    expect(getRole()).toBeNull();
    expect(getName()).toBeNull();
  });
});
