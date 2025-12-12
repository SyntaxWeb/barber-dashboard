import { useEffect, useState, ChangeEvent } from "react";
import { UserRound, Save, Upload, Camera } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { updateProviderProfile } from "@/services/profileService";

export default function Perfil() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setNome(user.nome ?? "");
    setEmail(user.email ?? "");
    setTelefone(user.telefone ?? "");
    setObjetivo(user.objetivo ?? "");
    setAvatarPreview(user.avatar_url ?? null);
  }, [user]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setAvatarFile(file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    } else {
      setAvatarPreview(user?.avatar_url ?? null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const payload = await updateProviderProfile({
        name: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        objetivo: objetivo.trim(),
        password: password ? password : undefined,
        password_confirmation: password ? passwordConfirmation : undefined,
        avatar: avatarFile ?? undefined,
      });
      updateUser(payload);
      setPassword("");
      setPasswordConfirmation("");
      toast({ title: "Perfil atualizado", description: "Suas informações foram salvas." });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-primary" />
              Meu Perfil
            </CardTitle>
            <CardDescription>Atualize as informações exibidas para sua equipe e clientes.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 rounded-full overflow-hidden border border-dashed border-border bg-muted flex items-center justify-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-2">
                  <input id="avatarUpload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  <Label htmlFor="avatarUpload" className="inline-flex items-center gap-2 text-sm font-medium text-primary cursor-pointer">
                    <Upload className="h-4 w-4" />
                    {avatarPreview ? "Trocar foto" : "Adicionar foto"}
                  </Label>
                  <p className="text-xs text-muted-foreground">PNG ou JPG até 2MB.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nome completo</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Descrição / Objetivo</Label>
                <Textarea
                  rows={3}
                  placeholder="Conte rapidamente sobre o seu trabalho."
                  value={objetivo}
                  onChange={(e) => setObjetivo(e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nova senha</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Opcional" />
                </div>
                <div className="space-y-2">
                  <Label>Confirme a senha</Label>
                  <Input
                    type="password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <Button type="submit" className="shadow-gold" disabled={saving}>
                {saving ? (
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
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
