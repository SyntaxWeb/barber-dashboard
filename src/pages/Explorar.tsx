import { format } from "date-fns";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CalendarDays, LocateFixed, MapPin, Search, Star, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { discoverCompanies, type DiscoveryFilters, type DiscoveryPage } from "@/services/discoveryService";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { ClientSidebar, ClientSidebarContent } from "@/components/layout/ClientSidebar";
import defaultLogo from "@/assets/syntax-logo.svg";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const shortDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

const readFilters = (params: URLSearchParams): DiscoveryFilters => {
  const filters: DiscoveryFilters = {};
  for (const key of ["q", "location", "service", "available_on"] as const) {
    const value = params.get(key);
    if (value) filters[key] = value;
  }
  for (const key of ["price_min", "price_max", "rating_min", "latitude", "longitude", "radius_km", "page"] as const) {
    const value = params.get(key);
    if (value !== null && value !== "" && Number.isFinite(Number(value))) filters[key] = Number(value);
  }
  if (filters.latitude === undefined || filters.longitude === undefined || Math.abs(filters.latitude) > 90 || Math.abs(filters.longitude) > 180) {
    delete filters.latitude; delete filters.longitude; delete filters.radius_km;
  }
  return filters;
};

export default function Explorar() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const filterKey = params.toString();
  const setFilters = (next: DiscoveryFilters | ((current: DiscoveryFilters) => DiscoveryFilters)) => {
    const value = typeof next === "function" ? next(filters) : next;
    const search = new URLSearchParams();
    Object.entries(value).forEach(([key, item]) => { if (item !== undefined && item !== "") search.set(key, String(item)); });
    if (search.toString() === params.toString()) setRetry((value) => value + 1);
    setParams(search);
  };
  const [retry, setRetry] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [locating, setLocating] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useClientAuth();
  const [query, setQuery] = useState(filters.q ?? "");
  const [location, setLocation] = useState(filters.location ?? "");
  const [service, setService] = useState(filters.service ?? "");
  const [priceMax, setPriceMax] = useState(filters.price_max?.toString() ?? "");
  const [rating, setRating] = useState(filters.rating_min?.toString() ?? "any");
  const [availableOn, setAvailableOn] = useState(filters.available_on ?? "");
  const coords = filters.latitude !== undefined && filters.longitude !== undefined ? { latitude: filters.latitude, longitude: filters.longitude } : null;
  const [radius, setRadius] = useState(String(filters.radius_km ?? 50));
  const [result, setResult] = useState<DiscoveryPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const current = readFilters(new URLSearchParams(filterKey));
    setQuery(current.q ?? ""); setLocation(current.location ?? ""); setService(current.service ?? "");
    setPriceMax(current.price_max?.toString() ?? ""); setRating(current.rating_min?.toString() ?? "any");
    setAvailableOn(current.available_on ?? ""); setRadius(String(current.radius_km ?? 50));
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    discoverCompanies(readFilters(new URLSearchParams(filterKey)), controller.signal)
      .then((data) => !cancelled && setResult(data))
      .catch((reason) => !cancelled && setError(reason instanceof Error ? reason.message : "Tente novamente."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; controller.abort(); };
  }, [filterKey, retry]);

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
      radius_km: coords ? Number(radius) : undefined,
      page: 1,
    });
  };

  const useLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Localização indisponível", description: "Informe uma cidade ou bairro.", variant: "destructive" });
      return;
    }
    if (!window.isSecureContext) {
      toast({ title: "A localização precisa de uma conexão segura", description: "Acesse por HTTPS ou pesquise por cidade e bairro.", variant: "destructive" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: position }) => {
        const next = { latitude: position.latitude, longitude: position.longitude };
        setLocating(false);
        setFilters((current) => ({ ...current, ...next, radius_km: Number(radius), page: 1 }));
      },
      (reason) => {
        setLocating(false);
        const title = reason.code === 1 ? "Permissão de localização negada" : reason.code === 3 ? "A localização demorou para responder" : "Não foi possível obter sua localização";
        toast({ title, description: "Você pode tentar novamente ou buscar por cidade e bairro.", variant: "destructive" });
      },
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
          {isAuthenticated && <Sheet open={mobileMenu} onOpenChange={setMobileMenu}><SheetTrigger asChild><Button variant="outline" size="icon" className="lg:hidden" aria-label="Abrir menu"><Menu className="h-5 w-5" /></Button></SheetTrigger><SheetContent side="left" className="w-80 p-0"><SheetTitle className="sr-only">Menu do cliente</SheetTitle><ClientSidebarContent mobile onNavigate={() => setMobileMenu(false)} /></SheetContent></Sheet>}
          <Button variant="outline" onClick={() => navigate(isAuthenticated ? "/cliente" : "/cliente/login")}>{isAuthenticated ? "Meu menu" : "Entrar"}</Button>
        </div>
      </header>

      {isAuthenticated && <ClientSidebar />}
      <main className={`mx-auto max-w-7xl px-4 pb-24 pt-8 sm:pt-12 ${isAuthenticated ? "lg:pl-72" : ""}`}>
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
              <Button type="button" variant={coords ? "secondary" : "outline"} className="w-full" disabled={locating} onClick={useLocation}>
                <LocateFixed className="mr-2 h-4 w-4" />{locating ? "Localizando..." : coords ? "Atualizar localização" : "Usar localização"}
              </Button>
            </div>
            {coords && <div className="space-y-2"><Label htmlFor="radius">Distância máxima</Label><Select value={radius} onValueChange={(value) => { setRadius(value); setFilters((current) => ({ ...current, radius_km: Number(value), page: 1 })); }}><SelectTrigger id="radius"><SelectValue /></SelectTrigger><SelectContent>{[5, 10, 25, 50, 100, 200].map((km) => <SelectItem key={km} value={String(km)}>{km} km</SelectItem>)}</SelectContent></Select></div>}
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
              <Input id="available" type="date" min={format(new Date(), "yyyy-MM-dd")} value={availableOn} onChange={(event) => setAvailableOn(event.target.value)} />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">{coords && <Button type="button" variant="outline" onClick={() => { setFilters((current) => ({ ...current, latitude: undefined, longitude: undefined, radius_km: undefined, page: 1 })); }}>Desativar localização</Button>}<Button type="button" variant="ghost" onClick={() => { setFilters({}); setQuery(""); setLocation(""); setService(""); setPriceMax(""); setRating("any"); setAvailableOn(""); }}>Limpar filtros</Button><Button type="submit"><Search className="mr-2 h-4 w-4" />Buscar</Button></div>
        </form>

        <div className="mt-10 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{result ? `${result.total} estabelecimentos` : "Estabelecimentos"}</h2>
          {coords && <span className="text-sm text-muted-foreground">Ordenados por proximidade</span>}
        </div>

        {loading && !result && <div className="mt-5 grid gap-4 md:grid-cols-2">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-96 w-full" />)}</div>}
        {loading && result && <p role="status" className="mt-4 text-sm text-muted-foreground">Atualizando resultados...</p>}
        {!loading && error && <div className="mt-6 border border-destructive/40 bg-destructive/10 p-6"><p className="font-medium">Não foi possível carregar a busca.</p><p className="text-sm text-muted-foreground">{error}</p><Button className="mt-4" variant="outline" onClick={() => setRetry((value) => value + 1)}>Tentar novamente</Button></div>}
        {!loading && !error && result?.data.length === 0 && <div className="mt-6 border-y border-border py-12 text-center"><MapPin className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 font-medium">Nenhum estabelecimento encontrado</p><p className="text-sm text-muted-foreground">{coords ? "Não encontramos estabelecimentos com localização cadastrada neste raio." : "Tente outra cidade ou remova alguns filtros."}</p><div className="mt-4 flex justify-center gap-2">{coords && <Button variant="outline" onClick={() => { const expanded = Math.min(200, Number(radius) * 2); setRadius(String(expanded)); setFilters((current) => ({ ...current, radius_km: expanded, page: 1 })); }} disabled={Number(radius) >= 200}>Ampliar raio</Button>}<Button variant="outline" onClick={() => setFilters({})}>Buscar sem filtros</Button></div></div>}

        {result && result.data.length > 0 && (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {result.data.map((company) => (
              <article key={company.id} className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
                <img src={company.cover_url ?? company.icon_url ?? defaultLogo} alt={company.nome} loading="lazy" decoding="async" className={company.cover_url ? "aspect-[16/8] w-full bg-zinc-800 object-cover" : "aspect-[16/8] w-full bg-white object-contain p-10"} />
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

        {result && result.last_page > 1 && <div className="mt-8 flex justify-center gap-3"><Button variant="outline" disabled={loading || result.current_page <= 1} onClick={() => setFilters((value) => ({ ...value, page: result.current_page - 1 }))}>Anterior</Button><span className="self-center text-sm text-muted-foreground">Página {result.current_page} de {result.last_page}</span><Button variant="outline" disabled={loading || result.current_page >= result.last_page} onClick={() => setFilters((value) => ({ ...value, page: result.current_page + 1 }))}>Próxima</Button></div>}
      </main>
    </div>
  );
}
