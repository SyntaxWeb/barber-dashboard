import { useState, type ReactNode } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePolling } from "@/hooks/use-polling";
import { useToast } from "@/hooks/use-toast";
import { fetchWhatsappDeliveries, normalizeQrCode, sendWhatsappTest, type WhatsappDelivery } from "@/services/whatsappService";
import type { WhatsappInfo } from "@/pages/configuracoes/types";

type Props = {
  children?: ReactNode;
  sessionId: string | null; status: string; info: WhatsappInfo; loading: boolean;
  alertsEnabled?: boolean; hasRecipient?: boolean;
  configured: boolean; error: string | null; qrCode: string | null;
  onRefresh: () => void; onStart: () => void; onLogout: () => void;
};
const statusLabels: Record<string, string> = {
  conectado: "Conectado", connected: "Conectado", connecting: "Aguardando conexão",
  disconnected: "Desconectado", desconectado: "Desconectado", not_created: "Não conectado", unconfigured: "Indisponível",
};
const deliveryLabels: Record<string, string> = { pending: "Preparando", accepted: "Aceito para envio", sent: "Enviado", delivered: "Entregue", read: "Lido", failed: "Falha no envio" };
const actionLabels: Record<string, string> = { created: "Novo agendamento", updated: "Agendamento alterado", cancelled: "Agendamento cancelado", test: "Mensagem de teste" };

export function WhatsappConnectionPanel({ children, sessionId, status, info, loading, configured, error, qrCode, onRefresh, onStart, onLogout, alertsEnabled = false, hasRecipient = false }: Props) {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [history, setHistory] = useState<WhatsappDelivery[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const connected = status === "conectado" || status === "connected";
  usePolling(async (signal) => {
    try {
      const data = await fetchWhatsappDeliveries(signal);
      if (signal.aborted) return;
      setHistory((current) => JSON.stringify(current) === JSON.stringify(data) ? current : data);
      setHistoryError(null);
    } catch (reason) {
      if (!signal.aborted) setHistoryError(reason instanceof Error ? reason.message : "Não foi possível consultar os envios.");
    }
  }, 20000, { immediate: true, requestKey: refresh });
  const test = async () => {
    setTesting(true);
    try {
      const result = await sendWhatsappTest();
      toast({ title: "Teste enviado", description: result.message });
    } catch (reason) {
      toast({ title: "Não foi possível enviar o teste", description: reason instanceof Error ? reason.message : "Tente novamente.", variant: "destructive" });
    } finally { setTesting(false); setRefresh((value) => value + 1); }
  };
  return <Card>
    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><MessageCircle className="h-4 w-4 text-primary" />WhatsApp automático</CardTitle>
      <CardDescription>Conecte o WhatsApp da empresa e configure o número que receberá os avisos de agendamentos.</CardDescription></CardHeader>
    <CardContent className="space-y-4 text-sm">
      {children}
      {!configured && <p role="status" className="text-muted-foreground">A conexão de WhatsApp ainda não está disponível. Solicite a ativação ao suporte.</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3 py-2" aria-busy={loading}>
        <div><p role="status" className="font-medium">Status: {statusLabels[status] ?? status}</p>{info.pushname && <p className="text-xs text-muted-foreground">{info.pushname}</p>}{info.phone && <p className="text-xs text-muted-foreground">Número conectado: {info.phone}</p>}</div>
        <div className="flex items-center gap-2">{loading && <Loader2 aria-label="Atualizando WhatsApp" className="h-4 w-4 animate-spin" />}<Button size="sm" variant="outline" onClick={() => onRefresh()} disabled={loading || !configured}>Atualizar</Button><Button size="sm" variant="ghost" onClick={onLogout} disabled={loading || !configured || (!connected && !qrCode && status !== "connecting")}>Desconectar</Button></div>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!connected && configured && <>
        {qrCode && <div className="rounded-lg border border-dashed border-border p-4 text-center"><p className="mb-3 text-xs text-muted-foreground">No celular, abra WhatsApp → Aparelhos conectados → Conectar aparelho.</p><img src={normalizeQrCode(qrCode) ?? undefined} alt="QR Code para conectar o WhatsApp" className="mx-auto h-48 w-48" /><p className="mt-2 text-xs text-muted-foreground">A conexão será identificada automaticamente. Se o código expirar, gere outro.</p></div>}
        <Button onClick={onStart} disabled={loading}>{loading ? "Conectando..." : qrCode ? "Gerar outro QR Code" : "Conectar WhatsApp"}</Button>
      </>}
      {connected && <div className="space-y-3"><p role="status" className="text-muted-foreground">{!hasRecipient ? "Próximo passo: preencha o WhatsApp para alertas e salve as alterações." : !alertsEnabled ? "Próximo passo: habilite Receber via WhatsApp e salve as alterações para ativar os avisos automáticos." : "Avisos automáticos ativados para o número salvo da empresa."}</p><Button variant="outline" onClick={test} disabled={testing || loading || !hasRecipient}>{testing ? "Enviando teste..." : "Enviar mensagem de teste"}</Button><p className="text-xs text-muted-foreground">O teste usa o número de alertas salvo. Ele não altera suas preferências.</p></div>}
      <div className="space-y-2 border-t border-border pt-4"><div className="flex items-center justify-between gap-2"><h3 className="font-medium">Últimos envios</h3><Button size="sm" variant="ghost" onClick={() => setRefresh((value) => value + 1)}>Atualizar histórico</Button></div>
        {historyError && <p role="alert" className="text-xs text-destructive">{historyError}</p>}
        {!historyError && history.length === 0 && <p className="text-xs text-muted-foreground">Os testes e os avisos enviados aparecerão aqui.</p>}
        {history.map((item) => <div key={item.id} className="rounded-md border border-border px-3 py-2"><div className="flex flex-wrap justify-between gap-2"><span>{actionLabels[item.action] ?? "Aviso do sistema"}{item.appointment_id ? ` #${item.appointment_id}` : ""}</span><span className={item.status === "failed" ? "text-destructive" : "text-muted-foreground"}>{deliveryLabels[item.status] ?? item.status}</span></div><p className="mt-1 text-xs text-muted-foreground">{item.recipient} · {new Date(item.created_at).toLocaleString("pt-BR")}</p>{item.error && <p className="mt-1 text-xs text-destructive">{item.error}</p>}</div>)}
        <p className="text-xs text-muted-foreground">“Aceito para envio” confirma o recebimento pelo serviço. A entrega e a leitura são atualizadas quando informadas pelo WhatsApp.</p>
      </div>
      {sessionId && <span className="sr-only">Conexão {sessionId}</span>}
    </CardContent>
  </Card>;
}
