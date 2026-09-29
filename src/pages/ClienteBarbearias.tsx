import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, CalendarPlus, MapPin, Search } from "lucide-react";
import { ClientPortalLayout } from "@/components/layout/ClientPortalLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { fetchClientCompanies, type ClientCompany } from "@/services/discoveryService";
import defaultLogo from "@/assets/syntax-logo.svg";

export default function ClienteBarbearias() {
  const navigate = useNavigate();
  const { setCompanySlug } = useClientAuth();
  const [companies, setCompanies] = useState<ClientCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClientCompanies().then(setCompanies).catch((reason) => setError(reason instanceof Error ? reason.message : "Tente novamente.")).finally(() => setLoading(false));
  }, []);

  const schedule = (company: ClientCompany) => {
    setCompanySlug(company.slug);
    navigate(`/cliente/agendar?company=${company.slug}`);
  };

  return <ClientPortalLayout><div className="space-y-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h1 className="text-2xl font-bold">Minhas barbearias</h1><p className="text-muted-foreground">Empresas onde você já realizou pelo menos um agendamento.</p></div><Button variant="outline" onClick={() => navigate("/explorar")}><Search className="mr-2 h-4 w-4" />Explorar</Button></div>{loading && <div className="grid gap-4 sm:grid-cols-2">{[1, 2].map((item) => <Skeleton key={item} className="h-44" />)}</div>}{error && <div className="border border-destructive/40 p-5 text-sm text-destructive">{error}</div>}{!loading && !error && companies.length === 0 && <div className="border-y border-border py-12 text-center"><Building2 className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 font-medium">Sua lista começa no primeiro agendamento</p><p className="text-sm text-muted-foreground">Explore estabelecimentos e encontre um horário.</p><Button className="mt-5" onClick={() => navigate("/explorar")}>Explorar agora</Button></div>}<div className="grid gap-4 sm:grid-cols-2">{companies.map((company) => <article key={company.id} className="rounded-lg border border-border bg-card p-5"><div className="flex gap-4"><img src={company.icon_url ?? defaultLogo} alt={company.nome} className="h-14 w-14 rounded-md object-cover" /><div className="min-w-0"><h2 className="font-semibold">{company.nome}</h2><p className="mt-1 flex items-start gap-1 text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{company.address ?? "Endereço não informado"}</p></div></div><p className="mt-4 text-sm text-muted-foreground">{company.appointments_count} {company.appointments_count === 1 ? "agendamento" : "agendamentos"}</p><div className="mt-4 flex gap-2"><Button className="flex-1" onClick={() => schedule(company)}><CalendarPlus className="mr-2 h-4 w-4" />Agendar</Button><Button variant="outline" onClick={() => navigate(`/e/${company.slug}/agendar`)}>Perfil</Button></div></article>)}</div></div></ClientPortalLayout>;
}
