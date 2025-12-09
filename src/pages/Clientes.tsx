import { useEffect, useMemo, useState, FormEvent } from "react";
import { format } from "date-fns";
import { Users, Plus, Search, Mail, Phone, MessageSquare } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { createCliente, fetchClientes, type Cliente } from "@/services/clientesService";
import { useAuth } from "@/contexts/AuthContext";

export default function Clientes() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [lastInvite, setLastInvite] = useState<{ nome: string; url: string } | null>(null);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchClientes()
      .then((data) => {
        setClientes(data);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Não foi possível carregar os clientes.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredClientes = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clientes;
    return clientes.filter((cliente) => {
      const base = `${cliente.nome} ${cliente.email ?? ""} ${cliente.telefone ?? ""}`.toLowerCase();
      return base.includes(term);
    });
  }, [clientes, search]);

  const companySlug = user?.company?.slug ?? undefined;
  const companyName = user?.company?.nome ?? "sua empresa";

  const clearForm = () => {
    setNome("");
    setEmail("");
    setTelefone("");
    setObservacoes("");
  };

  const formatPhoneForWhatsApp = (phone: string): string | null => {
    const digits = phone.replace(/\D/g, "");
    if (!digits) return null;
    if (digits.startsWith("55")) return digits;
    if (digits.length === 10 || digits.length === 11) {
      return `55${digits}`;
    }
    return digits;
  };

  const buildSignupLink = (cliente: Cliente): string | null => {
    if (typeof window === "undefined") return null;
    const url = new URL("/cliente/registro", window.location.origin);
    if (companySlug) {
      url.searchParams.set("company", companySlug);
    }
    url.searchParams.set("nome", cliente.nome);
    url.searchParams.set("email", cliente.email);
    if (cliente.telefone) {
      url.searchParams.set("telefone", cliente.telefone);
    }
    return url.toString();
  };

  const triggerOnboardingMessage = (cliente: Cliente) => {
    if (!cliente.telefone) {
      toast({
        title: "Número ausente",
        description: "Informe o WhatsApp para enviar o convite automaticamente.",
        variant: "destructive",
      });
      return;
    }

    const signupLink = buildSignupLink(cliente);
    if (!signupLink) return;

    const formattedPhone = formatPhoneForWhatsApp(cliente.telefone);
    if (!formattedPhone) {
      toast({
        title: "WhatsApp inválido",
        description: "Revise o número cadastrado para reenviar o convite.",
        variant: "destructive",
      });
      return;
    }

    const message = `Olá ${cliente.nome}! Você já está cadastrado na ${companyName}. Defina sua senha e confirme seus dados neste link: ${signupLink}`;
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    setLastInvite({ nome: cliente.nome, url: whatsappUrl });

    if (typeof window !== "undefined") {
      const opened = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      if (!opened) {
        toast({
          title: "Autorize o WhatsApp",
          description: "Clique no botão para reenviar manualmente o convite.",
        });
      } else {
        toast({
          title: "Convite preparado",
          description: "O WhatsApp foi aberto com a mensagem pronta para envio.",
        });
      }
    }
  };

  const handleManualInvite = () => {
    if (lastInvite && typeof window !== "undefined") {
      window.open(lastInvite.url, "_blank", "noopener,noreferrer");
    }
  };

  const handleCreateCliente = async (event: FormEvent) => {
    event.preventDefault();
    if (!nome.trim() || !email.trim() || !telefone.trim()) {
      toast({
        title: "Preencha os dados obrigatórios",
        description: "Nome, email e WhatsApp são necessários para enviar o convite.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const novo = await createCliente({
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        observacoes: observacoes.trim() || undefined,
      });
      setClientes((prev) => [novo, ...prev]);
      toast({
        title: "Cliente cadastrado",
        description: `${novo.nome} foi adicionado à sua base.`,
      });
      clearForm();
      setDialogOpen(false);
      triggerOnboardingMessage(novo);
    } catch (err) {
      toast({
        title: "Erro ao salvar",
        description: err instanceof Error ? err.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatCreatedAt = (cliente: Cliente) => {
    const value = cliente.created_at ?? cliente.updated_at;
    if (!value) return "—";
    try {
      return format(new Date(value), "dd/MM/yyyy");
    } catch {
      return value;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Base de clientes
            </p>
            <h1 className="mt-2 text-3xl font-bold">Clientes</h1>
            <p className="text-muted-foreground">
              Cadastre clientes manualmente e acompanhe o histórico em um só lugar.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou telefone"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) clearForm();
            }}>
              <Button onClick={() => setDialogOpen(true)} className="shadow-gold">
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo cliente</DialogTitle>
                  <DialogDescription>Registre dados básicos para iniciar o relacionamento.</DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleCreateCliente}>
                  <div className="space-y-2">
                    <Label htmlFor="cliente-nome">Nome completo</Label>
                    <Input
                      id="cliente-nome"
                      placeholder="Ex: João Silva"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cliente-email">Email</Label>
                    <Input
                      id="cliente-email"
                      type="email"
                      placeholder="cliente@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cliente-telefone">Telefone / WhatsApp</Label>
                    <Input
                      id="cliente-telefone"
                      placeholder="(11) 99999-0000"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cliente-observacoes">Observações</Label>
                    <Textarea
                      id="cliente-observacoes"
                      placeholder="Preferências, alergias, indicações..."
                      rows={3}
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
                      {saving ? "Salvando..." : "Cadastrar cliente"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {lastInvite && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Convite pronto para{" "}
              <span className="font-semibold text-foreground">{lastInvite.nome}</span>. Caso o WhatsApp não abra
              automaticamente, clique abaixo.
            </p>
            <Button variant="outline" className="gap-2" onClick={handleManualInvite}>
              <MessageSquare className="h-4 w-4" />
              Reenviar via WhatsApp
            </Button>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Clientes cadastrados</CardTitle>
            <CardDescription>
              {loading ? "Carregando..." : `${clientes.length} cliente${clientes.length === 1 ? "" : "s"} na base.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}

            {loading ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">Carregando clientes...</div>
            ) : filteredClientes.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center text-center text-muted-foreground">
                <p className="font-medium">Nenhum cliente encontrado</p>
                <p className="text-sm">Cadastre um novo cliente ou refine sua busca.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="w-32">Desde</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell>
                        <div className="font-medium">{cliente.nome}</div>
                        {cliente.observacoes && (
                          <p className="text-xs text-muted-foreground">{cliente.observacoes}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {cliente.email || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {cliente.telefone || "—"}
                        </div>
                      </TableCell>
                      <TableCell>{formatCreatedAt(cliente)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
