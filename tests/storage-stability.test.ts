import { afterEach, expect, it, vi } from "vitest";
import { safeLocalStorage } from "@/lib/localStorage";

afterEach(() => vi.restoreAllMocks());

it("keeps effects and page initialization working when local storage is blocked", () => {
  vi.spyOn(window, "localStorage", "get").mockImplementation(() => { throw new DOMException("Blocked", "SecurityError"); });
  expect(safeLocalStorage.getItem("barbeiro-theme")).toBeNull();
  expect(() => safeLocalStorage.setItem("barbeiro-theme", "brand")).not.toThrow();
  expect(() => safeLocalStorage.removeItem("barbeiro-user")).not.toThrow();
});

it("uses the token memory fallback when accessing session storage itself throws", async () => {
  vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => { throw new DOMException("Blocked", "SecurityError"); });
  vi.resetModules();
  const { secureStorage } = await import("@/lib/secureStorage");
  secureStorage.setItem("token", "in-memory-token");
  expect(secureStorage.getItem("token")).toBe("in-memory-token");
  secureStorage.removeItem("token");
  expect(secureStorage.getItem("token")).toBeNull();
});
