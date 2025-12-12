import { useEffect, useState, ChangeEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { useToast } from "@/hooks/use-toast";
import { updateClientProfile } from "@/services/profileService";
import { Camera, Upload, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";

export default function ClientePerfil() {
  const { client, updateClient, logout } = useClientAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { palettes } = useTheme();
  const clientTheme = palettes.client;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!client) return;
    setName(client.name);
    setEmail(client.email);
    setTelefone(client.telefone ?? "");
    setAvatarPreview(client.avatar_url ?? null);
  }, [client]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setAvatar(file);
    if (file) {
      const preview = URL.createObjectURL(file);
      setAvatarPreview(preview);
    } else {
      setAvatarPreview(client?.avatar_url ?? null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const payload = await updateClientProfile({
        name: name.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        password: password || undefined,
        password_confirmation: password ? passwordConfirmation : undefined,
        avatar: avatar ?? undefined,
      });
      updateClient(payload);
      setPassword("");
      setPasswordConfirmation("");
      toast({ title: "Perfil salvo", description: "Atualizamos suas informações." });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen py-10 px-4"
      style={{ background: `linear-gradient(180deg, ${clientTheme.background} 0%, ${clientTheme.surface} 70%, #ffffff 100%)` }}
    >
      <div className="mx-auto w-full max-w-2xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          Voltar
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Meu perfil</CardTitle>
            <CardDescription>Mantenha seus dados atualizados para agilizar os agendamentos.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full border border-dashed border-border flex items-center justify-center overflow-hidden bg-muted">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-2">
                  <input id="clienteAvatar" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  <Label htmlFor="clienteAvatar" className="flex items-center gap-2 text-sm text-primary cursor-pointer">
                    <Upload className="h-4 w-4" />
                    {avatarPreview ? "Trocar foto" : "Adicionar foto"}
                  </Label>
                  <p className="text-xs text-muted-foreground">PNG ou JPG até 2MB.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nova senha</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Opcional" />
                </div>
                <div className="space-y-2">
                  <Label>Confirmar senha</Label>
                  <Input
                    type="password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" className="shadow-gold" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Salvando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Salvar perfil
                    </span>
                  )}
                </Button>
                <Button variant="outline" type="button" onClick={logout}>
                  Encerrar sessão
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
