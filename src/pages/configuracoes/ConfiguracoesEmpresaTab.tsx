import { ChangeEvent } from "react";
import type { ReactNode } from "react";
import {
  Building2,
  Download,
  Images,
  Link2,
  Loader2,
  MessageCircle,
  Palette,
  Save,
  Scissors,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { normalizeQrCode } from "@/services/whatsappService";
import type { BrandTheme } from "@/lib/theme";
import type { EmpresaInfo } from "@/services/companyService";
import type { ExistingGalleryPhoto, GalleryUpload, WhatsappInfo } from "@/pages/configuracoes/types";

type ConfiguracoesEmpresaTabProps = {
  empresa: EmpresaInfo | null;
  iconePreview: string | null;
  onIconChange: (event: ChangeEvent<HTMLInputElement>) => void;
  empresaNome: string;
  onEmpresaNomeChange: (value: string) => void;
  empresaDescricao: string;
  onEmpresaDescricaoChange: (value: string) => void;
  onCopyLink: () => void;
  onDownloadQrCode: () => void;
  qrCodeUrl: string | null;
  notifyEmail: string;
  onNotifyEmailChange: (value: string) => void;
  notifyViaEmail: boolean;
  onNotifyViaEmailChange: (value: boolean) => void;
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
  whatsappSessionId: string | null;
  whatsappStatus: string;
  whatsappInfo: WhatsappInfo;
  whatsappLoading: boolean;
  onRefreshWhatsappStatus: () => void;
  onLogoutWhatsapp: () => void;
  whatsappError: string | null;
  whatsappQrCode: string | null;
  onStartWhatsapp: () => void;
  galleryExisting: ExistingGalleryPhoto[];
  galleryRemoved: string[];
  onToggleRemoveExistingPhoto: (photo: ExistingGalleryPhoto) => void;
  galleryPending: GalleryUpload[];
  onRemovePendingPhoto: (id: string) => void;
  onGalleryUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  dashboardTheme: BrandTheme;
  clientTheme: BrandTheme;
  renderThemeGrid: (type: "dashboard" | "client", theme: BrandTheme) => ReactNode;
  onSaveEmpresa: () => void;
  salvandoEmpresa: boolean;
};

export function ConfiguracoesEmpresaTab({
  empresa,
  iconePreview,
  onIconChange,
  empresaNome,
  onEmpresaNomeChange,
  empresaDescricao,
  onEmpresaDescricaoChange,
  onCopyLink,
  onDownloadQrCode,
  qrCodeUrl,
  notifyEmail,
  onNotifyEmailChange,
  notifyViaEmail,
  onNotifyViaEmailChange,
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
  whatsappSessionId,
  whatsappStatus,
  whatsappInfo,
  whatsappLoading,
  onRefreshWhatsappStatus,
  onLogoutWhatsapp,
  whatsappError,
  whatsappQrCode,
  onStartWhatsapp,
  galleryExisting,
  galleryRemoved,
  onToggleRemoveExistingPhoto,
  galleryPending,
  onRemovePendingPhoto,
  onGalleryUpload,
  dashboardTheme,
  clientTheme,
  renderThemeGrid,
  onSaveEmpresa,
  salvandoEmpresa,
}: ConfiguracoesEmpresaTabProps) {
  return (
    <TabsContent value="empresa" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Identidade da empresa
          </CardTitle>
          <CardDescription>Atualize o que seus clientes veem ao acessar o link público.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative h-20 w-20 rounded-full border border-dashed border-border bg-muted flex items-center justify-center overflow-hidden">
              {iconePreview ? (
                <img src={iconePreview} alt="Ícone da empresa" className="h-full w-full object-cover" />
              ) : (
                <Scissors className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <input id="iconeUpload" type="file" accept="image/*" className="hidden" onChange={onIconChange} />
              <Label
                htmlFor="iconeUpload"
                className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-primary"
              >
                <Upload className="h-4 w-4" />
                {iconePreview ? "Trocar ícone" : "Adicionar ícone"}
              </Label>
              <p className="text-xs text-muted-foreground">PNG ou JPG até 2MB.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome da empresa</Label>
              <Input value={empresaNome} onChange={(event) => onEmpresaNomeChange(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Slug público</Label>
              <Input readOnly value={empresa?.slug ?? "Não definido"} />
              <p className="text-xs text-muted-foreground">Usado na URL do portal do cliente.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição curta</Label>
            <Textarea
              value={empresaDescricao}
              onChange={(event) => onEmpresaDescricaoChange(event.target.value)}
              placeholder="Conte rapidamente o que torna seu atendimento especial."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Link público de agendamento</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input readOnly value={empresa?.agendamento_url ?? "Link indisponível"} className="sm:flex-1" />
              <div className="flex gap-2 sm:w-auto">
                <Button type="button" variant="outline" onClick={onCopyLink} disabled={!empresa?.agendamento_url}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
                <Button type="button" variant="outline" onClick={onDownloadQrCode} disabled={!qrCodeUrl}>
                  <Download className="h-4 w-4 mr-2" />
                  QR Code
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Use este link nas redes sociais, Telegram ou imprima o QR Code no seu estabelecimento.
            </p>
          </div>

          {qrCodeUrl && (
            <div className="mt-4 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-4">
              <div className="text-sm font-semibold text-muted-foreground">QR Code da empresa</div>
              <div className="rounded-lg bg-white p-4">
                <img src={qrCodeUrl} alt="QR Code da empresa" className="h-48 w-48" />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Imprima e deixe no balcão ou compartilhe digitalmente para seus clientes acessarem a agenda.
              </p>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="h-4 w-4 text-primary" />
                Alertas automáticos
              </CardTitle>
              <CardDescription>Integre e-mails e Telegram para receber notificações.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-2">
                <Label>Email para alertas</Label>
                <Input
                  type="email"
                  placeholder="contato@suaempresa.com"
                  value={notifyEmail}
                  onChange={(event) => onNotifyEmailChange(event.target.value)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Receber por email</p>
                  <p className="text-xs text-muted-foreground">Um aviso é enviado a cada novo agendamento.</p>
                </div>
                <Switch checked={notifyViaEmail} onCheckedChange={(checked) => onNotifyViaEmailChange(Boolean(checked))} />
              </div>
              <div className="space-y-3 text-sm">
                <p className="text-xs text-muted-foreground">
                  Capturaremos automaticamente o chat ao conectar com o bot @syntax_atendimento_bot.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={onGenerateTelegramLink} disabled={telegramLinkLoading}>
                    {telegramLinkLoading ? "Gerando..." : "Capturar automaticamente"}
                  </Button>
                  {telegramLink && (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => window.open(telegramLink, "_blank", "noopener,noreferrer")}
                      >
                        Abrir bot
                      </Button>
                      <Button
                        type="button"
                        onClick={onVerifyTelegramLink}
                        disabled={telegramVerifyLoading}
                        className="bg-emerald-600 hover:bg-emerald-500"
                      >
                        {telegramVerifyLoading ? "Verificando..." : "Confirmar captura"}
                      </Button>
                    </>
                  )}
                </div>
                <div className="space-y-2 pt-2">
                  <Label>WhatsApp para alertas</Label>
                  <Input
                    type="tel"
                    placeholder="5511999999999"
                    value={notifyWhatsapp}
                    onChange={(event) => onNotifyWhatsappChange(event.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">Receber via WhatsApp</p>
                    <p className="text-xs text-muted-foreground">
                      Os alertas serão enviados automaticamente para o número acima.
                    </p>
                  </div>
                  <Switch
                    checked={notifyViaWhatsapp}
                    onCheckedChange={(checked) => onNotifyViaWhatsappChange(Boolean(checked))}
                  />
                </div>
                {telegramLink && (
                  <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                    <p>Envie /start no bot usando o link acima e clique em confirmar captura.</p>
                    <p className="mt-1 break-all">{telegramLink}</p>
                  </div>
                )}
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">Receber via Telegram</p>
                    <p className="text-xs text-muted-foreground">Um job será disparado para seu integrador.</p>
                  </div>
                  <Switch
                    checked={notifyViaTelegram}
                    onCheckedChange={(checked) => onNotifyViaTelegramChange(Boolean(checked))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="h-4 w-4 text-primary" />
                WhatsApp automático
              </CardTitle>
              <CardDescription>Conecte seu WhatsApp via WPPConnect para disparar mensagens.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {!whatsappSessionId && (
                <p className="text-sm text-muted-foreground">
                  Clique em &quot;Gerar QR Code&quot; para criar a sessão e concluir a conexão.
                </p>
              )}
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div>
                  <p className="text-sm font-medium capitalize">Status: {whatsappStatus}</p>
                  {whatsappInfo.pushname && <p className="text-xs text-muted-foreground">{whatsappInfo.pushname}</p>}
                  {whatsappInfo.phone && <p className="text-xs text-muted-foreground">Número: {whatsappInfo.phone}</p>}
                </div>
                {whatsappLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={onRefreshWhatsappStatus}>
                      Atualizar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={onLogoutWhatsapp} disabled={whatsappStatus === "desconectado"}>
                      Desconectar
                    </Button>
                  </div>
                )}
              </div>
              {whatsappError && <p className="text-xs text-destructive">{whatsappError}</p>}
              {whatsappQrCode ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-3">
                    Abra o WhatsApp &gt; Aparelhos conectados e leia o QR Code abaixo.
                  </p>
                  <img
                    src={normalizeQrCode(whatsappQrCode) ?? undefined}
                    alt="QR Code do WhatsApp"
                    className="mx-auto h-48 w-48"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">Expirou? Clique em atualizar.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Se estiver desconectado gere um novo QR Code e leia pelo aplicativo.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={onStartWhatsapp} disabled={whatsappLoading}>
                      {whatsappLoading ? "Gerando..." : "Gerar QR Code"}
                    </Button>
                    <Button variant="outline" onClick={onRefreshWhatsappStatus} disabled={whatsappLoading}>
                      Recarregar QR Code
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Palette className="h-4 w-4 text-primary" />
                  Painel interno
                </CardTitle>
                <CardDescription>Personalize o visual do prestador.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {renderThemeGrid("dashboard", dashboardTheme)}
                <p className="text-xs text-muted-foreground">Impacta menu, botões e componentes internos.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Portal do cliente
                </CardTitle>
                <CardDescription>Defina a experiência para links públicos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {renderThemeGrid("client", clientTheme)}
                <p className="text-xs text-muted-foreground">
                  Essas cores são usadas no portal público e no fluxo de agendamento.
                </p>
              </CardContent>
            </Card>
          </div>

          <Button type="button" className="shadow-gold" onClick={onSaveEmpresa} disabled={salvandoEmpresa}>
            {salvandoEmpresa ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Salvando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Salvar informações
              </span>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Images className="h-5 w-5 text-primary" />
            Galeria do estabelecimento
          </CardTitle>
          <CardDescription>Adicione várias fotos para deixar o portal do cliente mais atrativo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {galleryExisting.map((photo) => {
              const identifier = photo.path ?? photo.url;
              const marked = identifier ? galleryRemoved.includes(identifier) : false;
              return (
                <div key={identifier} className="relative overflow-hidden rounded-xl border border-border/70 bg-muted/40">
                  <img
                    src={photo.url}
                    alt="Foto do estabelecimento"
                    className={`h-32 w-full object-cover ${marked ? "opacity-40" : ""}`}
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-xs text-white">
                    <span>{marked ? "Será removida" : "Publicada"}</span>
                    {identifier && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => onToggleRemoveExistingPhoto(photo)}
                      >
                        {marked ? "Desfazer" : "Remover"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {galleryPending.map((item) => (
              <div
                key={item.id}
                className="relative overflow-hidden rounded-xl border border-dashed border-primary/40 bg-primary/5"
              >
                <img src={item.preview} alt="Nova foto do estabelecimento" className="h-32 w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-xs text-white">
                  <span>Nova foto</span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onRemovePendingPhoto(item.id)}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            ))}
            {!galleryExisting.length && !galleryPending.length && (
              <div className="rounded-xl border border-dashed border-border/70 p-4 text-center text-sm text-muted-foreground sm:col-span-2 lg:col-span-4">
                Nenhuma foto cadastrada ainda. Use o botão abaixo para adicionar imagens do espaço.
              </div>
            )}
          </div>
          <div className="space-y-2">
            <input id="galleryUpload" type="file" accept="image/*" multiple className="hidden" onChange={onGalleryUpload} />
            <Label
              htmlFor="galleryUpload"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-dashed border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5"
            >
              <Upload className="h-4 w-4" />
              Adicionar fotos
            </Label>
            <p className="text-xs text-muted-foreground">
              Suporta PNG ou JPG até 3MB. Remoções e inclusões são aplicadas somente após salvar.
            </p>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
