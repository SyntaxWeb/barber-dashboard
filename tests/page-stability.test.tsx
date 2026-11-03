import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Perfil from "@/pages/Perfil";
import Configuracoes from "@/pages/Configuracoes";

const mocks = vi.hoisted(() => ({
  user: { id: 1, nome: "Nome original", email: "cliente@example.test", telefone: "41999991234", objetivo: "", avatar_url: null },
  updateUser: vi.fn(), updateCompany: vi.fn(),
  whatsapp: vi.fn(async () => ({ session_id: "test", status: { connected: true } })),
  toast: vi.fn(),
  logoutWhatsapp: vi.fn(async () => {}),
}));

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: mocks.user, updateUser: mocks.updateUser, updateCompany: mocks.updateCompany }) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock("@/components/layout/Layout", () => ({ Layout: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/pages/configuracoes/ConfiguracoesMensagens", () => ({ ConfiguracoesMensagens: ({ notifyWhatsapp, onNotifyWhatsappChange, whatsappStatus, onLogoutWhatsapp }: { notifyWhatsapp: string; onNotifyWhatsappChange: (value: string) => void; whatsappStatus: string; onLogoutWhatsapp: () => void }) => <><input aria-label="Telefone de aviso" value={notifyWhatsapp} onChange={(event) => onNotifyWhatsappChange(event.target.value)} /><output data-testid="connection-status">{whatsappStatus}</output><button onClick={onLogoutWhatsapp}>Desconectar WhatsApp</button></> }));
vi.mock("@/pages/configuracoes/ConfiguracoesAgendaTab", () => ({ ConfiguracoesAgendaTab: () => null }));
vi.mock("@/pages/configuracoes/ConfiguracoesServicosTab", () => ({ ConfiguracoesServicosTab: () => null }));
vi.mock("@/pages/configuracoes/ConfiguracoesIntegracoesTab", () => ({ ConfiguracoesIntegracoesTab: ({ messaging }: { messaging: React.ReactNode }) => <>{messaging}</> }));
vi.mock("@/pages/configuracoes/ConfiguracoesFidelidadeTab", () => ({ ConfiguracoesFidelidadeTab: () => null }));
vi.mock("@/services/agendaService", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/services/agendaService")>(),
  fetchServicos: vi.fn(async () => []),
  fetchConfiguracoes: vi.fn(async () => ({ horarioInicio: "08:00", horarioFim: "18:00", intervaloMinutos: 30, diasBloqueados: [] })),
}));
vi.mock("@/services/companyService", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/services/companyService")>(),
  fetchEmpresa: vi.fn(async () => ({ nome: "Empresa teste", notify_whatsapp: "41999991234" })),
}));
vi.mock("@/services/loyaltyService", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/services/loyaltyService")>(),
  fetchLoyaltySettings: vi.fn(async () => ({ spend_amount_cents_per_point: 100, points_per_visit: 1 })),
  fetchLoyaltyRewards: vi.fn(async () => []),
}));
vi.mock("@/services/integrationService", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/services/integrationService")>(),
  fetchIntegrations: vi.fn(async () => []),
}));
vi.mock("@/services/whatsappService", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/services/whatsappService")>(),
  fetchWhatsappSession: mocks.whatsapp,
  logoutWhatsappSession: mocks.logoutWhatsapp,
}));

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("profile stability", () => {
  it("preserves an unsaved draft when the session refreshes, then resets for another account", () => {
    const { rerender } = render(<Perfil />);
    const name = screen.getByDisplayValue("Nome original") as HTMLInputElement;
    fireEvent.change(name, { target: { value: "Meu rascunho" } });
    mocks.user = { ...mocks.user, nome: "Nome atualizado no servidor" };
    rerender(<Perfil />);
    expect(name.value).toBe("Meu rascunho");
    mocks.user = { ...mocks.user, id: 2, nome: "Outra conta" };
    rerender(<Perfil />);
    expect(name.value).toBe("Outra conta");
  });
});

describe("WhatsApp configuration", () => {
  it("loads connection status once and does not refetch while typing a destination phone", async () => {
    render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Configuracoes /></MemoryRouter>);
    const phone = await screen.findByLabelText("Telefone de aviso");
    await waitFor(() => expect((phone as HTMLInputElement).value).toBe("41999991234"));
    expect(mocks.whatsapp).toHaveBeenCalledTimes(1);
    fireEvent.change(phone, { target: { value: "4" } });
    fireEvent.change(phone, { target: { value: "41" } });
    fireEvent.change(phone, { target: { value: "41988881234" } });
    expect(mocks.whatsapp).toHaveBeenCalledTimes(1);
    expect((phone as HTMLInputElement).value).toBe("41988881234");
  });
});


describe("connected session monitoring", () => {
  it("detects a dropped connection without resetting the edited form", async () => {
    vi.useFakeTimers();
    mocks.whatsapp.mockResolvedValueOnce({ session_id: "test", status: { connected: true } })
      .mockResolvedValueOnce({ session_id: "test", status: { connected: false }, pairing: false });
    render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Configuracoes /></MemoryRouter>);
    await act(async () => {});
    const phone = screen.getByLabelText("Telefone de aviso") as HTMLInputElement;
    fireEvent.change(phone, { target: { value: "41988881234" } });
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
    expect(mocks.whatsapp).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("connection-status").textContent).toBe("desconectado");
    expect(screen.getByLabelText("Telefone de aviso")).toBe(phone);
    expect(phone.value).toBe("41988881234");
  });

  it("ignores a delayed connected response after an explicit logout", async () => {
    vi.useFakeTimers();
    let resolve!: (data: { session_id: string; status: { connected: boolean } }) => void;
    mocks.whatsapp.mockResolvedValueOnce({ session_id: "test", status: { connected: true } })
      .mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Configuracoes /></MemoryRouter>);
    await act(async () => {});
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
    fireEvent.click(screen.getByRole("button", { name: "Desconectar WhatsApp" }));
    await act(async () => {});
    await act(async () => { resolve({ session_id: "test", status: { connected: true } }); });
    expect(screen.getByTestId("connection-status").textContent).toBe("desconectado");
    await act(async () => { await vi.advanceTimersByTimeAsync(60000); });
    expect(mocks.whatsapp).toHaveBeenCalledTimes(2);
  });
});
