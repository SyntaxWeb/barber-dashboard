import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { type ReactNode } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider><AuthProvider>{children}</AuthProvider></ThemeProvider>
);

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("reports a connection failure without claiming the password is invalid", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
  const { result } = renderHook(useAuth, { wrapper });
  await expect(result.current.login("user@example.com", "password")).rejects.toThrow("Não foi possível conectar ao servidor");
  expect(result.current.isAuthenticated).toBe(false);
});

it("returns invalid credentials only when the API responds with 401", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 401 })));
  const { result } = renderHook(useAuth, { wrapper });
  await expect(result.current.login("user@example.com", "password")).resolves.toBe(false);
});

it("reports an unavailable API without claiming the password is invalid", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Bad Gateway", { status: 502 })));
  const { result } = renderHook(useAuth, { wrapper });
  await expect(result.current.login("user@example.com", "password")).rejects.toThrow("O serviço está temporariamente indisponível");
});
