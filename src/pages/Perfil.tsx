import { useEffect, useRef, useState, ChangeEvent } from "react";
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

  const [nome, setNome] = useState(user?.nome ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [telefone, setTelefone] = useState(user?.telefone ?? "");
  const [objetivo, setObjetivo] = useState(user?.objetivo ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url ?? null);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [saving, setSaving] = useState(false);

  const { id: profileId, nome: profile_nome, email: profile_email, telefone: profile_telefone, objetivo: profile_objetivo, avatar_url: profile_avatar_url } = user ?? {};
  const dirty = useRef(false);
  const loadedId = useRef<number | undefined>();
  useEffect(() => {
    if (dirty.current && loadedId.current === profileId) return;
    loadedId.current = profileId;
    dirty.current = false;
    setNome(profile_nome ?? "");
    setEmail(profile_email ?? "");
    setTelefone(profile_telefone ?? "");
    setObjetivo(profile_objetivo ?? "");
    setAvatarPreview(profile_avatar_url ?? null);
  }, [profileId, profile_nome, profile_email, profile_telefone, profile_objetivo, profile_avatar_url]);

  useEffect(() => () => { if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview); }, [avatarPreview]);

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
      dirty.current = false;
      updateUser(payload);
      setAvatarFile(null);
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
            <form onChangeCapture={() => { dirty.current = true; }} className="space-y-5" onSubmit={handleSubmit}>
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
