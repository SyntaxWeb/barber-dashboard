import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, LocateFixed, MapPin, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { discoverCompanies, type DiscoveryFilters, type DiscoveryPage } from "@/services/discoveryService";
import { ClientSidebar } from "@/components/layout/ClientSidebar";
import defaultLogo from "@/assets/syntax-logo.svg";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const shortDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

const storedCoordinates = (() => { try { const value = sessionStorage.getItem("cliente-localizacao-atual"); return value ? JSON.parse(value) as { latitude: number; longitude: number } : null; } catch { return null; } })();

export default function Explorar() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useClientAuth();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [service, setService] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [rating, setRating] = useState("any");
  const [availableOn, setAvailableOn] = useState("");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(storedCoordinates);
  const [filters, setFilters] = useState<DiscoveryFilters>(storedCoordinates ? { ...storedCoordinates, radius_km: 30 } : {});
  const [result, setResult] = useState<DiscoveryPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    discoverCompanies(filters)
      .then((data) => !cancelled && setResult(data))
      .catch((reason) => !cancelled && setError(reason instanceof Error ? reason.message : "Tente novamente."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [filters]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setFilters({
      q: query.trim() || undefined,
      location: location.trim() || undefined,
      service: service.trim() || undefined,
      price_max: priceMax ? Number(priceMax) : undefined,
      rating_min: rating === "any" ? undefined : Number(rating),
      available_on: availableOn || undefined,
      ...(coords ?? {}),
      radius_km: coords ? 50 : undefined,
      page: 1,
    });
  };

  const useLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Localização indisponível", description: "Informe uma cidade ou bairro.", variant: "destructive" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords: position }) => {
        const next = { latitude: position.latitude, longitude: position.longitude };
        setCoords(next);
        setFilters((current) => ({ ...current, ...next, radius_km: 50, page: 1 }));
      },
      () => toast({ title: "Localização não autorizada", description: "Você ainda pode buscar por cidade ou bairro." }),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="device-safe-surface border-b border-white/10 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/explorar" className="flex items-center gap-3">
            <img src={defaultLogo} alt="SyntaxAtendimento" className="h-9 w-9" />
            <span className="font-semibold">SyntaxAtendimento</span>
          </Link>
          <Button variant="outline" onClick={() => navigate(isAuthenticated ? "/cliente" : "/cliente/login")}>{isAuthenticated ? "Meu menu" : "Entrar"}</Button>
        </div>
      </header>

      {isAuthenticated && <ClientSidebar />}
      <main className="mx-auto max-w-none lg:pl-72 px-4 pb-24 pt-8 sm:pt-12">
        <div className="mb-7 max-w-2xl">
          <h1 className="text-3xl font-semibold sm:text-4xl">Encontre seu próximo atendimento</h1>
          <p className="mt-2 text-muted-foreground">Barbearias e serviços de beleza, com horários que combinam com seu dia.</p>
        </div>

        <form onSubmit={submit} className="rounded-xl border border-white/10 bg-zinc-900 p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="search">Nome, serviço ou região</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="search" value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Barbearia, corte, manicure..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Cidade ou bairro</Label>
              <Input id="location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Ex.: Centro, Curitiba" />
            </div>
            <div className="flex items-end gap-2">
              <Button type="button" variant={coords ? "secondary" : "outline"} className="w-full" onClick={useLocation}>
                <LocateFixed className="mr-2 h-4 w-4" />{coords ? "Localização ativa" : "Usar localização"}
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service">Serviço</Label>
              <Input id="service" value={service} onChange={(event) => setService(event.target.value)} placeholder="Ex.: Barba" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Preço máximo</Label>
              <Input id="price" type="number" min="0" value={priceMax} onChange={(event) => setPriceMax(event.target.value)} placeholder="R$" />
            </div>
            <div className="space-y-2">
              <Label>Avaliação mínima</Label>
              <Select value={rating} onValueChange={setRating}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="any">Qualquer nota</SelectItem><SelectItem value="4">4 ou mais</SelectItem><SelectItem value="4.5">4,5 ou mais</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="available">Disponível em</Label>
              <Input id="available" type="date" min={new Date().toISOString().slice(0, 10)} value={availableOn} onChange={(event) => setAvailableOn(event.target.value)} />
            </div>
          </div>
          <div className="mt-4 flex justify-end"><Button type="submit"><Search className="mr-2 h-4 w-4" />Buscar</Button></div>
        </form>

        <div className="mt-10 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{result ? `${result.total} estabelecimentos` : "Estabelecimentos"}</h2>
          {coords && <span className="text-sm text-muted-foreground">Ordenados por proximidade</span>}
        </div>

        {loading && <div className="mt-5 grid gap-4 md:grid-cols-2">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-96 w-full" />)}</div>}
        {!loading && error && <div className="mt-6 border border-destructive/40 bg-destructive/10 p-6"><p className="font-medium">Não foi possível carregar a busca.</p><p className="text-sm text-muted-foreground">{error}</p><Button className="mt-4" variant="outline" onClick={() => setFilters({ ...filters })}>Tentar novamente</Button></div>}
        {!loading && !error && result?.data.length === 0 && <div className="mt-6 border-y border-border py-12 text-center"><MapPin className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 font-medium">Nenhum estabelecimento encontrado</p><p className="text-sm text-muted-foreground">Tente ampliar a região ou remover alguns filtros.</p></div>}

        {!loading && !error && result && result.data.length > 0 && (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {result.data.map((company) => (
              <article key={company.id} className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
                <img src={company.cover_url ?? company.icon_url ?? defaultLogo} alt={company.nome} className={company.cover_url ? "aspect-[16/8] w-full bg-zinc-800 object-cover" : "aspect-[16/8] w-full bg-white object-contain p-10"} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3"><h3 className="text-lg font-semibold">{company.nome}</h3>{company.rating !== null && company.rating !== undefined ? <span className="flex items-center gap-1 text-sm"><Star className="h-4 w-4 fill-primary text-primary" />{company.rating.toFixed(1)} <span className="text-muted-foreground">({company.reviews_count})</span></span> : <span className="text-xs text-muted-foreground">Sem avaliações</span>}</div>
                  <p className="mt-2 flex min-h-10 items-start gap-2 text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{company.address ?? "Endereço disponível no agendamento"}{company.distance_km !== null && company.distance_km !== undefined ? ` · ${company.distance_km.toFixed(1)} km` : ""}</p>
                  <div className="mt-4 space-y-2">{company.services.slice(0, 3).map((item) => <div key={item.id} className="flex justify-between text-sm"><span>{item.nome}</span><span className="font-medium">{money.format(item.preco)}</span></div>)}</div>
                  <div className="mt-4 flex min-h-6 items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4" />{company.next_availability ? `Próximo: ${shortDate.format(new Date(`${company.next_availability.date}T12:00:00`))} às ${company.next_availability.time}` : "Consulte a agenda"}</div>
                  <Button className="mt-5 w-full" onClick={() => navigate(`/e/${company.slug}/agendar`)}>Ver horários</Button>
                </div>
              </article>
            ))}
          </div>
        )}

        {result && result.last_page > 1 && <div className="mt-8 flex justify-center gap-3"><Button variant="outline" disabled={result.current_page <= 1} onClick={() => setFilters((value) => ({ ...value, page: result.current_page - 1 }))}>Anterior</Button><span className="self-center text-sm text-muted-foreground">Página {result.current_page} de {result.last_page}</span><Button variant="outline" disabled={result.current_page >= result.last_page} onClick={() => setFilters((value) => ({ ...value, page: result.current_page + 1 }))}>Próxima</Button></div>}
      </main>
    </div>
  );
}
