import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLayoutEffect } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ClientAuthProvider } from "@/contexts/ClientAuthContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { apiFetch } from "@/services/api";

vi.mock("@/services/companyService", () => ({ fetchEmpresaPublic: vi.fn(async () => ({ id: 1, slug: "empresa", nome: "Empresa" })) }));

const user = { id: 1, name: "Profissional", role: "provider", company: { id: 1, slug: "empresa", nome: "Empresa", subscription_status: "ativo" } };

function Harness() {
  const auth = useAuth();
  const { activeKind, activatePalette } = useTheme();
  useLayoutEffect(() => activatePalette("client"), [activatePalette]);
  return <><output>{activeKind}</output><span>{auth.user?.nome}</span><button onClick={() => auth.updateUser({ ...user, name: "Atualizado" })}>Atualizar sessão</button></>;
}

beforeEach(() => {
  localStorage.clear(); sessionStorage.clear();
  sessionStorage.setItem("barbeiro-token", "provider-token");
  localStorage.setItem("barbeiro-user", JSON.stringify(user));
  localStorage.setItem("cliente-company", "empresa");
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(user), { status: 200, headers: { "Content-Type": "application/json" } })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("session and palette stability", () => {
  it("does not switch a client route back to the dashboard palette when provider data refreshes", async () => {
    render(<ThemeProvider><AuthProvider><ClientAuthProvider><Harness /></ClientAuthProvider></AuthProvider></ThemeProvider>);
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("client"));
    act(() => { screen.getByRole("button").click(); });
    expect(screen.getByRole("status").textContent).toBe("client");
    expect(screen.getByText("Atualizado")).toBeTruthy();
  });

  it("does not revalidate on every rapid tablet visibility event", async () => {
    vi.spyOn(Date, "now").mockReturnValue(100000);
    render(<ThemeProvider><AuthProvider><Harness /></AuthProvider></ThemeProvider>);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    await act(async () => {});
    for (let i = 0; i < 10; i++) act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(fetch).toHaveBeenCalledTimes(1);
    vi.spyOn(Date, "now").mockReturnValue(131000);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });

  it("does not expire a newer session when an aborted request returns 401", async () => {
    let resolve!: (response: Response) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((done) => { resolve = done; })));
    const expired = vi.fn();
    window.addEventListener("auth:expired", expired);
    const controller = new AbortController();
    const request = apiFetch("/api/me", { headers: { Authorization: "Bearer old-token" }, signal: controller.signal }, "provider");
    controller.abort();
    resolve(new Response("{}", { status: 401 }));
    await request;
    expect(expired).not.toHaveBeenCalled();
    window.removeEventListener("auth:expired", expired);
  });
});
