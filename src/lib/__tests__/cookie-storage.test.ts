import { describe, it, expect, beforeEach } from "vitest";
import { setCookie, getCookie, deleteCookie, getCookieJson } from "../api/cookie-storage";

describe("cookie-storage", () => {
  beforeEach(() => {
    // Clear cookies before each test
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
  });

  it("should set and get a string cookie", () => {
    setCookie("testKey", "helloWorld", "session");
    expect(getCookie("testKey")).toBe("helloWorld");
  });

  it("should handle cookie deletion", () => {
    setCookie("toDelete", "value", 1);
    expect(getCookie("toDelete")).toBe("value");
    deleteCookie("toDelete");
    expect(getCookie("toDelete")).toBeNull();
  });

  it("should return null for non-existent cookie", () => {
    expect(getCookie("nonExistent")).toBeNull();
  });

  it("should set and get JSON cookie values", () => {
    setCookie("jsonKey", JSON.stringify({ role: "admin", id: 1 }), 7);
    const result = getCookieJson<{ role: string; id: number }>("jsonKey");
    expect(result).toEqual({ role: "admin", id: 1 });
  });

  it("should return null for invalid JSON cookie", () => {
    setCookie("invalidJson", "not-json-content", "session");
    expect(getCookieJson("invalidJson")).toBeNull();
  });
});
