import { WhatsappConnectionPanel } from "@/components/whatsapp/WhatsappConnectionPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { EmpresaInfo } from "@/services/companyService";
import type { WhatsappInfo } from "@/pages/configuracoes/types";

type Props = {
  empresa: EmpresaInfo | null;
  notifyTelegram: string;
  onSaveEmpresa: () => void;
  salvandoEmpresa: boolean;
  notifyWhatsapp: string;
  onNotifyWhatsappChange: (value: string) => void;
  notifyViaWhatsapp: boolean;
  onNotifyViaWhatsappChange: (value: boolean) => void;
  telegramLink: string | null;
  telegramLinkLoading: boolean;
  onGenerateTelegramLink: () => void;
  onVerifyTelegramLink: () => void;
  telegramVerifyLoading: boolean;
  notifyViaTelegram: boolean;
  onNotifyViaTelegramChange: (value: boolean) => void;
  whatsappConfigured: boolean;
  whatsappSessionId: string | null;
  whatsappStatus: string;
  whatsappInfo: WhatsappInfo;
  whatsappLoading: boolean;
  onRefreshWhatsappStatus: () => void;
  onLogoutWhatsapp: () => void;
  whatsappError: string | null;
  whatsappQrCode: string | null;
  onStartWhatsapp: () => void;
};

export function ConfiguracoesMensagens({ empresa, notifyTelegram, onSaveEmpresa, salvandoEmpresa,
  notifyWhatsapp,
  onNotifyWhatsappChange,
  notifyViaWhatsapp,
  onNotifyViaWhatsappChange,
  telegramLink,
  telegramLinkLoading,
  onGenerateTelegramLink,
  onVerifyTelegramLink,
  telegramVerifyLoading,
  notifyViaTelegram,
  onNotifyViaTelegramChange,
  whatsappConfigured,
  whatsappSessionId,
  whatsappStatus,
  whatsappInfo,
  whatsappLoading,
  onRefreshWhatsappStatus,
  onLogoutWhatsapp,
  whatsappError,
  whatsappQrCode,
  onStartWhatsapp
}: Props) {
  return <div className="space-y-6">
          <WhatsappConnectionPanel
            sessionId={whatsappSessionId} configured={whatsappConfigured} status={whatsappStatus}
            alertsEnabled={Boolean(empresa?.notify_via_whatsapp)} hasRecipient={Boolean(empresa?.notify_whatsapp?.trim())}
            info={whatsappInfo} loading={whatsappLoading} error={whatsappError} qrCode={whatsappQrCode}
            onRefresh={onRefreshWhatsappStatus} onStart={onStartWhatsapp} onLogout={onLogoutWhatsapp}
          >
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div>
        <h3 className="font-medium">Alertas de agendamentos por WhatsApp</h3>
        <p className="text-sm text-muted-foreground">Escolha o número que receberá os avisos. O número conectado e o destinatário dos alertas podem ser diferentes.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notifyWhatsapp">WhatsApp para alertas</Label>
        <Input id="notifyWhatsapp" type="tel" autoComplete="tel" value={notifyWhatsapp}
          onChange={(event) => onNotifyWhatsappChange(event.target.value)} placeholder="(11) 99999-9999"
          aria-describedby="notifyWhatsappHelp" />
        <p id="notifyWhatsappHelp" className="text-xs text-muted-foreground">Informe o DDD e o número. Para outros países, inclua + e o código do país. Salve antes de enviar o teste.</p>
      </div>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="notifyViaWhatsapp">Receber via WhatsApp</Label>
        <Switch id="notifyViaWhatsapp" checked={notifyViaWhatsapp} onCheckedChange={onNotifyViaWhatsappChange} />
      </div>
      <Button type="button" variant="outline" onClick={onSaveEmpresa} disabled={salvandoEmpresa}>
        {salvandoEmpresa ? "Salvando..." : "Salvar integrações de mensagens"}
      </Button>
    </div>

          </WhatsappConnectionPanel>

    <Card>
      <CardHeader><CardTitle>Telegram</CardTitle><CardDescription>Vincule seu Telegram para receber avisos de agendamentos.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <p role="status" className="text-sm">{notifyTelegram ? "Telegram vinculado" : "Telegram não vinculado"}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onGenerateTelegramLink} disabled={telegramLinkLoading}>
            {telegramLinkLoading ? "Gerando link..." : "Gerar link do Telegram"}
          </Button>
          {telegramLink && <Button asChild variant="outline"><a href={telegramLink} target="_blank" rel="noopener noreferrer">Abrir Telegram</a></Button>}
          <Button type="button" variant="outline" onClick={onVerifyTelegramLink} disabled={!telegramLink || telegramVerifyLoading}>
            {telegramVerifyLoading ? "Verificando..." : "Verificar vínculo"}
          </Button>
        </div>
        {telegramLink && <p className="text-sm text-muted-foreground">Abra o link, envie /start ao bot e clique em Verificar vínculo.</p>}
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="notifyViaTelegram">Receber via Telegram</Label>
          <Switch id="notifyViaTelegram" checked={notifyViaTelegram} onCheckedChange={onNotifyViaTelegramChange} disabled={!notifyTelegram} />
        </div>
        <Button type="button" variant="outline" onClick={onSaveEmpresa} disabled={salvandoEmpresa}>
          {salvandoEmpresa ? "Salvando..." : "Salvar preferências do Telegram"}
        </Button>
      </CardContent>
    </Card>
  </div>;
}
