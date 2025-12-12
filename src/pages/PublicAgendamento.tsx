import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarClock, Copy, LogIn, QrCode, Share2, Sparkles, UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { fetchEmpresaPublic, type EmpresaInfo } from "@/services/companyService";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function PublicAgendamento() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, setCompanySlug } = useClientAuth();
  const { palettes } = useTheme();
  const clientTheme = palettes.client;

  const [empresa, setEmpresa] = useState<EmpresaInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchEmpresaPublic(slug)
      .then((data) => {
        setEmpresa(data);
        setCompanySlug(slug, data);
      })
      .catch(() => {
        toast({
          title: "Empresa nÇœo encontrada",
          description: "Verifique se o link foi digitado corretamente.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [setCompanySlug, slug, toast]);

  const agendamentoUrl = useMemo(() => {
    if (empresa?.agendamento_url) return empresa.agendamento_url;
    if (slug) return `${window.location.origin}/e/${slug}/agendar`;
    return "";
  }, [empresa?.agendamento_url, slug]);

  const qrCodeUrl = agendamentoUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(agendamentoUrl)}`
    : null;

  const handleCopyLink = async () => {
    if (!agendamentoUrl) return;
    try {
      await navigator.clipboard.writeText(agendamentoUrl);
      toast({ title: "Link copiado", description: "Envie para seus clientes ou parceiros." });
    } catch {
      toast({
        title: "NÇœo foi possÇðvel copiar",
        description: "Copie manualmente o link exibido.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadQr = async () => {
    if (!qrCodeUrl) return;
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `qrcode-${slug ?? "empresa"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      toast({
        title: "NÇœo foi possÇðvel baixar",
        description: "Abra o QR Code em nova guia e salve manualmente.",
        variant: "destructive",
      });
    }
  };

  const goTo = (path: string) => {
    if (!slug) return;
    navigate(`${path}?company=${slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Preparando a agenda pÇ§blica...</p>
        </div>
      </div>
    );
  }

  if (!empresa || !slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
        <Card className="max-w-md border-border shadow-gold">
          <CardHeader>
            <CardTitle>Link invÇ­lido</CardTitle>
            <CardDescription>PeÇõa um novo link para o prestador ou tente novamente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={() => navigate("/")}>
              Voltar ao inÇðcio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-10 px-4"
      style={{
        background: `linear-gradient(180deg, ${clientTheme.background} 0%, ${clientTheme.surface} 60%, #ffffff 100%)`,
      }}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <Button variant="ghost" className="w-fit -ml-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card className="border-border shadow-gold/40">
          <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:gap-10">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                {empresa.icon_url ? (
                  <img src={empresa.icon_url} alt={empresa.nome} className="h-20 w-20 rounded-full object-cover" />
                ) : (
                  <Sparkles className="h-8 w-8" />
                )}
              </div>
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground">Portal SyntaxAtendimento</p>
                <h1 className="text-3xl font-bold text-foreground">{empresa.nome}</h1>
                <p className="text-muted-foreground">{empresa.descricao || "ServiÇõos personalizados sob demanda."}</p>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-3 rounded-xl border border-dashed border-border bg-background p-4">
              <div className="flex items-center gap-3">
                <CalendarClock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Link exclusivo</p>
                  <p className="font-semibold break-all">{agendamentoUrl}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyLink}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar link
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadQr} disabled={!qrCodeUrl}>
                  <QrCode className="mr-2 h-4 w-4" />
                  Baixar QR Code
                </Button>
                <Button variant="secondary" size="sm" onClick={() => window.open(agendamentoUrl, "_blank")}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Abrir em nova guia
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="h-5 w-5 text-primary" />
                Sou cliente
              </CardTitle>
              <CardDescription>Use seu email e senha para acessar a agenda desta empresa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Fazendo login vocÇ¦ visualiza serviÇõos, horÇ­rios livres e pode acompanhar seus agendamentos.
              </p>
              <Button className="w-full shadow-gold" onClick={() => goTo("/cliente/login")}>
                Entrar e agendar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {isAuthenticated && (
                <Button variant="outline" className="w-full" onClick={() => goTo("/cliente/agendar")}>
                  Ir direto para a agenda
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Primeiro atendimento
              </CardTitle>
              <CardDescription>Crie sua conta gratuita no SyntaxAtendimento para seguir.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Com uma conta vocÇ¦ pode agendar em vÇ¸rias empresas e acompanhar todos os atendimentos em um Çœnico lugar.
              </p>
              <Button variant="secondary" className="w-full" onClick={() => goTo("/cliente/registro")}>
                Criar conta gratuita
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {qrCodeUrl && (
          <Card className="border-dashed border-border">
            <CardHeader>
              <CardTitle>QR Code pronto para impressão</CardTitle>
              <CardDescription>
                Compartilhe o cÇ?digo com clientes em mesas, balcÇœo ou redes sociais e direcione para este portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 md:flex-row md:items-center md:gap-10">
              <div className="rounded-xl bg-white p-4 shadow-inner">
                <img src={qrCodeUrl} alt={`QR Code ${empresa.nome}`} className="h-60 w-60" />
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <Separator />
                <p>Escaneie o cÇ?digo para abrir este portal direto do celular.</p>
                <p>Ideal para Telegram, Instagram, cartÇëes de visita e materiais impressos.</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleDownloadQr}>
                    <QrCode className="mr-2 h-4 w-4" />
                    Baixar PNG
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCopyLink}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar link
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
