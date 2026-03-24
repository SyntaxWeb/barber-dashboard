import { useEffect, useMemo, useState, FormEvent } from "react";
import { format } from "date-fns";
import { Users, Plus, Search, Mail, Phone, MessageSquare, Eye } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { createCliente, fetchClienteHistory, fetchClientes, type Cliente, type ClienteHistory } from "@/services/clientesService";
import { useAuth } from "@/contexts/AuthContext";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { buildWhatsAppUrl, openWhatsAppChat } from "@/lib/whatsapp";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Clientes() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [lastInvite, setLastInvite] = useState<{ nome: string; url: string } | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<ClienteHistory | null>(null);

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
    const signupLink = buildSignupLink(cliente);
    if (!signupLink) return;

    const message = `Olá ${cliente.nome}! Você já está cadastrado na ${companyName}. Defina sua senha e confirme seus dados neste link: ${signupLink}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(signupLink)}&text=${encodeURIComponent(message)}`;
    setLastInvite({ nome: cliente.nome, url: telegramUrl });

    if (typeof window !== "undefined") {
      const opened = window.open(telegramUrl, "_blank", "noopener,noreferrer");
      if (!opened) {
        toast({
          title: "Autorize o Telegram",
          description: "Clique no botão para reenviar manualmente o convite.",
        });
      } else {
        toast({
          title: "Convite preparado",
          description: "O Telegram foi aberto com a mensagem pronta para envio.",
        });
      }
    }
  };

  const handleManualInvite = () => {
    if (lastInvite && typeof window !== "undefined") {
      window.open(lastInvite.url, "_blank", "noopener,noreferrer");
    }
  };

  const handleOpenHistory = (cliente: Cliente) => {
    setHistoryDialogOpen(true);
    setHistoryLoading(true);
    setHistoryError(null);
    setHistoryData(null);
    fetchClienteHistory(cliente.id)
      .then((data) => setHistoryData(data))
      .catch((err) => {
        setHistoryError(err instanceof Error ? err.message : "Não foi possível carregar o histórico.");
      })
      .finally(() => setHistoryLoading(false));
  };

  const handleWhatsAppContact = (cliente: Cliente) => {
    const message = `Olá ${cliente.nome}! Aqui é da ${companyName}.`;
    const opened = openWhatsAppChat(cliente.telefone, message);

    if (!opened) {
      toast({
        title: "WhatsApp indisponível",
        description: "Não foi possível abrir a conversa. Verifique o telefone do cliente.",
        variant: "destructive",
      });
    }
  };

  const handleCreateCliente = async (event: FormEvent) => {
    event.preventDefault();
    if (!nome.trim() || !email.trim() || !telefone.trim()) {
      toast({
        title: "Preencha os dados obrigatórios",
        description: "Nome, email e telefone são necessários para enviar o convite.",
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

  const formatAppointmentDate = (value?: string | null) => {
    if (!value) return "—";
    try {
      return format(new Date(value), "dd/MM/yyyy");
    } catch {
      return value;
    }
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return "—";
    try {
      return format(new Date(value), "dd/MM/yyyy 'às' HH:mm");
    } catch {
      return value;
    }
  };

  const handleHistoryDialogChange = (open: boolean) => {
    setHistoryDialogOpen(open);
    if (!open) {
      setHistoryData(null);
      setHistoryError(null);
    }
  };

  const renderHistoryContent = (mobileView: boolean) => (
    <HistoryContent
      historyLoading={historyLoading}
      historyError={historyError}
      historyData={historyData}
      formatDateTime={formatDateTime}
      formatAppointmentDate={formatAppointmentDate}
      isMobile={mobileView}
    />
  );

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
                    <Label htmlFor="cliente-telefone">Telefone / Telegram</Label>
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
              <span className="font-semibold text-foreground">{lastInvite.nome}</span>. Caso o Telegram não abra
              automaticamente, clique abaixo.
            </p>
            <Button variant="outline" className="gap-2" onClick={handleManualInvite}>
              <MessageSquare className="h-4 w-4" />
              Reenviar via Telegram
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
            ) : isMobile ? (
              <div className="space-y-3">
                {filteredClientes.map((cliente) => (
                  <div key={cliente.id} className="rounded-xl border border-border/60 bg-background p-4 shadow-sm">
                    <div className="space-y-1">
                      <p className="font-medium">{cliente.nome}</p>
                      {cliente.observacoes ? (
                        <p className="text-xs text-muted-foreground">{cliente.observacoes}</p>
                      ) : null}
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="min-w-0 break-all">{cliente.email || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{cliente.telefone || "—"}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Cliente desde {formatCreatedAt(cliente)}</p>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      {buildWhatsAppUrl(cliente.telefone) ? (
                        <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => handleWhatsAppContact(cliente)}>
                          <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                          WhatsApp
                        </Button>
                      ) : null}
                      <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => handleOpenHistory(cliente)}>
                        <Eye className="h-4 w-4" />
                        Ver histórico
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="w-32">Desde</TableHead>
                    <TableHead className="w-36 text-right">Ações</TableHead>
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
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {buildWhatsAppUrl(cliente.telefone) ? (
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => handleWhatsAppContact(cliente)}>
                              <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                              WhatsApp
                            </Button>
                          ) : null}
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => handleOpenHistory(cliente)}>
                            <Eye className="h-4 w-4" />
                            Ver histórico
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {isMobile ? (
          <Sheet open={historyDialogOpen} onOpenChange={handleHistoryDialogChange}>
            <SheetContent side="bottom" className="h-[92vh] rounded-t-2xl px-0 pb-0 pt-6">
              <SheetHeader className="px-4 text-left">
                <SheetTitle>Histórico do cliente</SheetTitle>
                <SheetDescription>
                  {historyData?.client?.nome ? `${historyData.client.nome} - resumo de fidelidade e atendimentos.` : "Resumo de fidelidade e atendimentos."}
                </SheetDescription>
              </SheetHeader>
              {renderHistoryContent(true)}
              <SheetFooter className="border-t px-4 py-4">
                <Button variant="outline" onClick={() => setHistoryDialogOpen(false)}>
                  Fechar
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        ) : (
          <Dialog open={historyDialogOpen} onOpenChange={handleHistoryDialogChange}>
            <DialogContent className="max-h-[calc(100vh-2rem)] max-w-5xl overflow-hidden p-0">
              <DialogHeader className="px-6 pb-0 pt-6">
                <DialogTitle>Histórico do cliente</DialogTitle>
                <DialogDescription>
                  {historyData?.client?.nome ? `${historyData.client.nome} - resumo de fidelidade e atendimentos.` : "Resumo de fidelidade e atendimentos."}
                </DialogDescription>
              </DialogHeader>
              {renderHistoryContent(false)}
              <DialogFooter className="px-6 pb-6 pt-0">
                <Button variant="outline" onClick={() => setHistoryDialogOpen(false)}>
                  Fechar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
}

interface HistoryContentProps {
  historyLoading: boolean;
  historyError: string | null;
  historyData: ClienteHistory | null;
  formatDateTime: (value?: string | null) => string;
  formatAppointmentDate: (value?: string | null) => string;
  isMobile: boolean;
}

function HistoryContent({
  historyLoading,
  historyError,
  historyData,
  formatDateTime,
  formatAppointmentDate,
  isMobile,
}: HistoryContentProps) {
  if (historyLoading) {
    return <div className="px-4 py-6 text-center text-muted-foreground sm:px-6">Carregando histórico...</div>;
  }

  if (historyError) {
    return (
      <div className="mx-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive sm:mx-6">
        {historyError}
      </div>
    );
  }

  if (!historyData) return null;

  return (
    <div className="max-h-[calc(100%-7rem)] overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="space-y-6">
        <div className="grid items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-4 lg:sticky lg:top-0">
            <Card>
              <CardHeader>
                <CardTitle>Pontos disponíveis</CardTitle>
                <CardDescription>Saldo atual de fidelidade.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-5xl font-bold leading-none text-primary">{historyData.loyalty.points_balance}</div>
                <p className="text-sm text-muted-foreground">
                  {historyData.loyalty.points_balance === 1
                    ? "1 ponto acumulado neste cliente."
                    : `${historyData.loyalty.points_balance} pontos acumulados neste cliente.`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recompensas disponíveis</CardTitle>
                <CardDescription>Benefícios que este cliente já pode resgatar agora.</CardDescription>
              </CardHeader>
              <CardContent>
                {historyData.loyalty.available_rewards.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Ainda não há recompensas disponíveis com o saldo atual deste cliente.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {historyData.loyalty.available_rewards.map((reward) => (
                      <div
                        key={reward.id}
                        className={`rounded-xl border px-4 py-3 ${
                          reward.available
                            ? "border-amber-300/70 bg-amber-50"
                            : "border-border/60 bg-muted/20"
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="font-medium">{reward.name}</p>
                            {reward.description ? (
                              <p className="mt-1 text-sm text-muted-foreground">{reward.description}</p>
                            ) : null}
                          </div>
                          <div className="shrink-0 text-left sm:text-right">
                            <p className="text-sm font-semibold text-primary">{reward.points_cost} pts</p>
                            <p className="text-xs text-muted-foreground">
                              {reward.available ? "Disponível" : "Indisponível"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Últimas movimentações</CardTitle>
              <CardDescription>Até 20 registros recentes.</CardDescription>
            </CardHeader>
            <CardContent>
              {historyData.loyalty.transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma movimentação registrada.</p>
              ) : (
                <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1 text-sm">
                  {historyData.loyalty.transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                    >
                      <div className="min-w-0">
                        <p className="font-medium leading-tight">{transaction.reason ?? "Movimentação de pontos"}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDateTime(transaction.created_at)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-sm font-semibold ${
                          transaction.points >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {transaction.points >= 0 ? "+" : ""}{transaction.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Atendimentos recentes</CardTitle>
            <CardDescription>Últimos horários registrados para este cliente.</CardDescription>
          </CardHeader>
          <CardContent>
            {historyData.appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum atendimento registrado.</p>
            ) : isMobile ? (
              <div className="space-y-3">
                {historyData.appointments.map((appointment) => (
                  <div key={appointment.id} className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Data</span>
                        <span className="font-medium">{formatAppointmentDate(appointment.data)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Hora</span>
                        <span className="font-medium">{appointment.horario ?? "—"}</span>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-muted-foreground">Serviço</span>
                        <span className="max-w-[65%] text-right font-medium">{appointment.servico ?? "—"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-medium capitalize">{appointment.status ?? "—"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border/60">
                <div className="max-h-[340px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Data</TableHead>
                        <TableHead className="whitespace-nowrap">Hora</TableHead>
                        <TableHead className="min-w-[180px]">Serviço</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyData.appointments.map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell className="whitespace-nowrap">{formatAppointmentDate(appointment.data)}</TableCell>
                          <TableCell className="whitespace-nowrap">{appointment.horario ?? "—"}</TableCell>
                          <TableCell>{appointment.servico ?? "—"}</TableCell>
                          <TableCell className="whitespace-nowrap capitalize">{appointment.status ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
