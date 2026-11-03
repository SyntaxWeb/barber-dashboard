import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useState, type ComponentProps } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfiguracoesEmpresaTab } from "@/pages/configuracoes/ConfiguracoesEmpresaTab";
import { ConfiguracoesMensagens } from "@/pages/configuracoes/ConfiguracoesMensagens";
import { ConfiguracoesIntegracoesTab } from "@/pages/configuracoes/ConfiguracoesIntegracoesTab";
import { WhatsappConnectionPanel } from "@/components/whatsapp/WhatsappConnectionPanel";

const mocks = vi.hoisted(() => ({ history: vi.fn(), sendTest: vi.fn(), toast: vi.fn() }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock("@/services/whatsappService", () => ({
  fetchWhatsappDeliveries: mocks.history, sendWhatsappTest: mocks.sendTest,
  normalizeQrCode: (value: string) => value.startsWith("data:") ? value : `data:image/png;base64,${value}`,
}));
const props = { alertsEnabled: true, hasRecipient: true, sessionId: "syntax-company-1", configured: true, status: "conectado", info: { phone: "5541999990000" },
  loading: false, error: null, qrCode: null, onRefresh: vi.fn(), onStart: vi.fn(), onLogout: vi.fn() };

beforeEach(() => {
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  mocks.history.mockResolvedValue([]);
  mocks.sendTest.mockResolvedValue({ message: "Teste enviado", status: "accepted" });
});
afterEach(cleanup);

it("sends a test only after the provider clicks and refreshes delivery history", async () => {
  render(<WhatsappConnectionPanel {...props} />);
  await waitFor(() => expect(mocks.history).toHaveBeenCalledTimes(1));
  expect(mocks.sendTest).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem de teste" }));
  await waitFor(() => expect(mocks.sendTest).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(mocks.history).toHaveBeenCalledTimes(2));
});

it("shows the pairing QR and delegates reconnect without offering a send action", () => {
  render(<WhatsappConnectionPanel {...props} status="connecting" qrCode="data:image/png;base64,test" />);
  expect(screen.getByAltText("QR Code para conectar o WhatsApp")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Enviar mensagem de teste" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Gerar outro QR Code" }));
  expect(props.onStart).toHaveBeenCalledTimes(1);
});

it("distinguishes accepted messages from delivered messages", async () => {
  mocks.history.mockResolvedValue([
    { id: 1, recipient: "5541999991234", status: "accepted", action: "created", appointment_id: 12, created_at: "2026-11-02T12:00:00Z" },
    { id: 2, recipient: "5541999991234", status: "delivered", action: "test", created_at: "2026-11-02T12:00:00Z" },
  ]);
  render(<WhatsappConnectionPanel {...props} />);
  expect(await screen.findByText("Aceito para envio")).toBeTruthy();
  expect(screen.getByText("Entregue")).toBeTruthy();
  expect(screen.getByText("Novo agendamento #12")).toBeTruthy();
});

it("shows an actionable error if the saved recipient is missing", async () => {
  mocks.sendTest.mockRejectedValue(new Error("Salve o número de WhatsApp para alertas antes de enviar um teste."));
  render(<WhatsappConnectionPanel {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem de teste" }));
  await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ description: expect.stringContaining("Salve o número") })));
  expect(screen.getByRole("button", { name: "Enviar mensagem de teste" }).hasAttribute("disabled")).toBe(false);
});

it("does not offer connection actions when the server is unconfigured", () => {
  render(<WhatsappConnectionPanel {...props} configured={false} status="unconfigured" />);
  expect(screen.queryByRole("button", { name: "Conectar WhatsApp" })).toBeNull();
  expect(screen.getByText(/Solicite a ativação ao suporte/)).toBeTruthy();
});


it("shows the missing activation steps and uses saved preferences", () => {
  const { rerender } = render(<WhatsappConnectionPanel {...props} hasRecipient={false} alertsEnabled={false} />);
  expect(screen.getByText(/preencha o WhatsApp para alertas/)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Enviar mensagem de teste" }).hasAttribute("disabled")).toBe(true);
  rerender(<WhatsappConnectionPanel {...props} hasRecipient alertsEnabled={false} />);
  expect(screen.getByText(/habilite Receber via WhatsApp/)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Enviar mensagem de teste" }).hasAttribute("disabled")).toBe(false);
});

it("lets the provider enter and save the alert recipient from the integrations tab", () => {
  const save = vi.fn();
  const toggle = vi.fn();
  function CompanyForm() {
    const [phone, setPhone] = useState("");
    const [savedPhone, setSavedPhone] = useState("");
    const defaults = {
      empresaNome: "Barbearia", empresaLatitude: "", empresaLongitude: "",
      galleryExisting: [], galleryRemoved: [], galleryPending: [],
      whatsappConfigured: true, whatsappStatus: "connected", whatsappInfo: {},
      notifyWhatsapp: phone, onNotifyWhatsappChange: setPhone, notifyViaWhatsapp: false,
      onNotifyViaWhatsappChange: toggle,
      empresa: { notify_whatsapp: savedPhone, notify_via_whatsapp: false },
      onSaveEmpresa: () => { save(phone); setSavedPhone(phone); },
    } as unknown as ComponentProps<typeof ConfiguracoesMensagens>;
    return <Tabs defaultValue="empresa"><TabsList><TabsTrigger value="empresa">Empresa</TabsTrigger><TabsTrigger value="integracoes">Integrações</TabsTrigger></TabsList><ConfiguracoesEmpresaTab {...defaults as unknown as ComponentProps<typeof ConfiguracoesEmpresaTab>} /><ConfiguracoesIntegracoesTab integrations={[]} loading={false} actionProvider={null} onConnect={vi.fn()} onDisconnect={vi.fn()} onRefresh={vi.fn()} messaging={<ConfiguracoesMensagens {...defaults} />} /></Tabs>;
  }
  render(<CompanyForm />);
  expect(screen.queryByLabelText("WhatsApp para alertas")).toBeNull();
  expect(screen.queryByText("WhatsApp automático")).toBeNull();
  fireEvent.mouseDown(screen.getByRole("tab", { name: "Integrações" }), { button: 0, ctrlKey: false });
  const testButton = screen.getByRole("button", { name: "Enviar mensagem de teste" });
  expect(testButton.hasAttribute("disabled")).toBe(true);
  fireEvent.change(screen.getByLabelText("WhatsApp para alertas"), { target: { value: "(41) 99999-1234" } });
  expect(testButton.hasAttribute("disabled")).toBe(true);
  fireEvent.click(screen.getByRole("switch", { name: "Receber via WhatsApp" }));
  expect(toggle).toHaveBeenCalledWith(true);
  fireEvent.click(screen.getByRole("button", { name: "Salvar integrações de mensagens" }));
  expect(save).toHaveBeenCalledWith("(41) 99999-1234");
  expect(testButton.hasAttribute("disabled")).toBe(false);
  expect(screen.getAllByText("WhatsApp automático")).toHaveLength(1);
  expect(screen.getByText("Telegram não vinculado")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Gerar link do Telegram" })).toBeTruthy();
  expect(mocks.sendTest).not.toHaveBeenCalled();
});
