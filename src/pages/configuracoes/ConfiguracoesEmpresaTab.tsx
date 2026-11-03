import { useToast } from "@/hooks/use-toast";
import { ChangeEvent, useState } from "react";
import {
  Building2,
  Download,
  Images,
  Link2,
  LocateFixed,
  Save,
  Scissors,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import type { EmpresaInfo } from "@/services/companyService";
import type { ExistingGalleryPhoto, GalleryUpload } from "@/pages/configuracoes/types";

type ConfiguracoesEmpresaTabProps = {
  empresa: EmpresaInfo | null;
  iconePreview: string | null;
  onIconChange: (event: ChangeEvent<HTMLInputElement>) => void;
  empresaNome: string;
  onEmpresaNomeChange: (value: string) => void;
  empresaDescricao: string;
  onEmpresaDescricaoChange: (value: string) => void;
  empresaEndereco: string;
  onEmpresaEnderecoChange: (value: string) => void;
  empresaBairro: string;
  onEmpresaBairroChange: (value: string) => void;
  empresaCidade: string;
  onEmpresaCidadeChange: (value: string) => void;
  empresaEstado: string;
  onEmpresaEstadoChange: (value: string) => void;
  empresaCep: string;
  onEmpresaCepChange: (value: string) => void;
  empresaLatitude: string;
  onEmpresaLatitudeChange: (value: string) => void;
  empresaLongitude: string;
  onEmpresaLongitudeChange: (value: string) => void;
  empresaDescobertaAtiva: boolean;
  onEmpresaDescobertaAtivaChange: (value: boolean) => void;
  onCopyLink: () => void;
  onDownloadQrCode: () => void;
  qrCodeUrl: string | null;
  galleryExisting: ExistingGalleryPhoto[];
  galleryRemoved: string[];
  onToggleRemoveExistingPhoto: (photo: ExistingGalleryPhoto) => void;
  galleryPending: GalleryUpload[];
  onRemovePendingPhoto: (id: string) => void;
  onGalleryUpload: (event: ChangeEvent<HTMLInputElement>) => void;
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
  empresaEndereco,
  onEmpresaEnderecoChange,
  empresaBairro,
  onEmpresaBairroChange,
  empresaCidade,
  onEmpresaCidadeChange,
  empresaEstado,
  onEmpresaEstadoChange,
  empresaCep,
  onEmpresaCepChange,
  empresaLatitude,
  onEmpresaLatitudeChange,
  empresaLongitude,
  onEmpresaLongitudeChange,
  empresaDescobertaAtiva,
  onEmpresaDescobertaAtivaChange,
  onCopyLink,
  onDownloadQrCode,
  qrCodeUrl,
  galleryExisting,
  galleryRemoved,
  onToggleRemoveExistingPhoto,
  galleryPending,
  onRemovePendingPhoto,
  onGalleryUpload,
  onSaveEmpresa,
  salvandoEmpresa,
}: ConfiguracoesEmpresaTabProps) {
  const { toast } = useToast();
  const [locating, setLocating] = useState(false);
  const locateCompany = () => {
    if (!navigator.geolocation || !window.isSecureContext) {
      toast({ title: "Localização indisponível", description: "Use HTTPS ou informe latitude e longitude manualmente.", variant: "destructive" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      onEmpresaLatitudeChange(coords.latitude.toFixed(7));
      onEmpresaLongitudeChange(coords.longitude.toFixed(7));
      setLocating(false);
      toast({ title: "Localização preenchida", description: "Salve as alterações para atualizar o perfil público." });
    }, (error) => {
      setLocating(false);
      toast({ title: error.code === 1 ? "Permissão de localização negada" : error.code === 3 ? "Tempo de localização esgotado" : "Localização indisponível", description: "Tente novamente ou informe as coordenadas manualmente.", variant: "destructive" });
    }, { timeout: 10000, enableHighAccuracy: true });
  };
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

          <div className="border-y border-border py-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Descoberta pública</p>
                <p className="text-xs text-muted-foreground">Permite que clientes encontrem a empresa na busca.</p>
              </div>
              <Switch checked={empresaDescobertaAtiva} onCheckedChange={onEmpresaDescobertaAtivaChange} />
            </div>
            {empresaDescobertaAtiva && (!empresaLatitude.trim() || !empresaLongitude.trim()) && <p role="status" className="mb-4 rounded-md border border-amber-400/40 bg-amber-500/10 p-3 text-sm">Sua empresa aparece na busca geral, mas precisa de latitude e longitude para aparecer na busca por proximidade. Capture a localização estando no estabelecimento e salve as alterações.</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><Label>Endereço</Label><Input value={empresaEndereco} onChange={(event) => onEmpresaEnderecoChange(event.target.value)} placeholder="Rua e número" /></div>
              <div className="space-y-2"><Label>Bairro</Label><Input value={empresaBairro} onChange={(event) => onEmpresaBairroChange(event.target.value)} /></div>
              <div className="space-y-2"><Label>Cidade</Label><Input value={empresaCidade} onChange={(event) => onEmpresaCidadeChange(event.target.value)} /></div>
              <div className="space-y-2"><Label>Estado</Label><Input maxLength={2} value={empresaEstado} onChange={(event) => onEmpresaEstadoChange(event.target.value.toUpperCase())} placeholder="UF" /></div>
              <div className="space-y-2"><Label>CEP</Label><Input value={empresaCep} onChange={(event) => onEmpresaCepChange(event.target.value)} /></div>
              <div className="space-y-2"><Label>Latitude</Label><Input inputMode="decimal" value={empresaLatitude} onChange={(event) => onEmpresaLatitudeChange(event.target.value)} placeholder="-23.5505" /></div>
              <div className="space-y-2"><Label>Longitude</Label><Input inputMode="decimal" value={empresaLongitude} onChange={(event) => onEmpresaLongitudeChange(event.target.value)} placeholder="-46.6333" /></div>
            </div>
            <Button type="button" variant="outline" className="mt-4" onClick={locateCompany} disabled={locating}>
              <LocateFixed className="mr-2 h-4 w-4" />{locating ? "Localizando..." : "Usar localização atual"}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">A distância só é exibida quando estas coordenadas e a localização do cliente estão disponíveis.</p>
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
