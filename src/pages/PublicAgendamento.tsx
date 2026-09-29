import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock3, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { useToast } from "@/hooks/use-toast";
import { fetchEmpresaPublic, type EmpresaInfo } from "@/services/companyService";
import { clientFetchFeedbackSummary, type CompanyFeedbackSummary } from "@/services/clientPortalService";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import defaultLogo from "@/assets/syntax-logo.svg";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function PublicAgendamento() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, setCompanySlug } = useClientAuth();
  const [company, setCompany] = useState<EmpresaInfo | null>(null);
  const [feedback, setFeedback] = useState<CompanyFeedbackSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([fetchEmpresaPublic(slug), clientFetchFeedbackSummary(slug)])
      .then(([companyData, feedbackData]) => {
        setCompany(companyData);
        setFeedback(feedbackData);
        setCompanySlug(slug, companyData);
      })
      .catch(() => toast({ title: "Empresa não encontrada", description: "Confira o link e tente novamente.", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [setCompanySlug, slug, toast]);

  const schedule = () => {
    if (!slug) return;
    navigate(`${isAuthenticated ? "/cliente/agendar" : "/cliente/login"}?company=${slug}`);
  };

  if (loading) return <div className="mx-auto min-h-screen max-w-6xl px-4 py-8"><Skeleton className="h-[460px] w-full" /><div className="mt-6 grid gap-5 md:grid-cols-3"><Skeleton className="h-60 md:col-span-2" /><Skeleton className="h-60" /></div></div>;
  if (!company || !slug) return <div className="flex min-h-screen items-center justify-center px-4"><div className="text-center"><h1 className="text-2xl font-bold">Perfil indisponível</h1><p className="mt-2 text-muted-foreground">Este link não existe ou não está mais ativo.</p><Button className="mt-5" onClick={() => navigate("/explorar")}>Explorar estabelecimentos</Button></div></div>;

  const gallery = company.gallery_photos ?? [];
  const heroImage = gallery[0] ?? company.icon_url ?? defaultLogo;
  const profilePhotos = gallery.length ? gallery : [heroImage];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-5">
        <div className="mb-4 flex items-center justify-between"><Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button><Button variant="outline" onClick={() => navigate("/explorar")}>Explorar</Button></div>
        <section className="relative min-h-[430px] overflow-hidden rounded-lg bg-muted">
          <Carousel opts={{ loop: profilePhotos.length > 1 }} className="absolute inset-0 h-full w-full">
            <CarouselContent className="ml-0 h-full">
              {profilePhotos.map((photo, index) => (
                <CarouselItem key={`${photo}-${index}`} className="h-[430px] basis-full pl-0">
                  <img
                    src={photo}
                    alt={`Foto ${index + 1} de ${company.nome}`}
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            {profilePhotos.length > 1 && <>
              <CarouselPrevious className="left-4 z-20 bg-background/85" />
              <CarouselNext className="right-4 z-20 bg-background/85" />
              <span className="absolute right-5 top-5 z-20 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
                {profilePhotos.length} fotos
              </span>
            </>}
          </Carousel>
          <div className="absolute inset-0 bg-black/55" />
          <div className="relative flex min-h-[430px] max-w-3xl flex-col justify-end p-6 text-white sm:p-10">
            <div className="mb-4 flex items-center gap-3"><img src={company.icon_url ?? heroImage} alt="" onError={({ currentTarget }) => { currentTarget.onerror = null; currentTarget.src = heroImage; }} className="h-14 w-14 rounded-md border border-white/30 bg-white object-cover" /><div>{feedback?.average !== null && feedback?.average !== undefined ? <p className="flex items-center gap-1 text-sm"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{feedback.average.toFixed(1)} · {feedback.count} avaliações</p> : <p className="text-sm text-white/75">Ainda sem avaliações</p>}</div></div>
            <h1 className="text-4xl font-bold sm:text-5xl">{company.nome}</h1>
            <p className="mt-3 max-w-2xl text-white/85">{company.descricao || "Serviços de beleza com agendamento online."}</p>
            {company.address && <p className="mt-4 flex items-start gap-2 text-sm text-white/80"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{company.address}</p>}
            <Button size="lg" className="mt-6 w-fit" onClick={schedule}><CalendarDays className="mr-2 h-5 w-5" />Ver horários disponíveis</Button>
          </div>
        </section>
        <section className="grid gap-8 py-9 lg:grid-cols-[1fr_360px]">
          <div>
            <h2 className="text-2xl font-semibold">Serviços</h2>
            <div className="mt-4 divide-y divide-border border-y border-border">
              {(company.services ?? []).map((service) => <div key={service.id} className="flex items-center justify-between gap-4 py-4"><div><h3 className="font-medium">{service.nome}</h3><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><Clock3 className="h-4 w-4" />{service.duracao} min</p></div><p className="font-semibold">{money.format(service.preco)}</p></div>)}
              {(company.services ?? []).length === 0 && <p className="py-8 text-sm text-muted-foreground">Os serviços serão exibidos em breve.</p>}
            </div>
          </div>
          <aside className="h-fit border-l border-border pl-0 lg:pl-7">
            <h2 className="text-xl font-semibold">Avaliações</h2>
            {feedback?.average !== null && feedback?.average !== undefined ? <div className="mt-3 flex items-end gap-3"><span className="text-4xl font-bold">{feedback.average.toFixed(1)}</span><span className="pb-1 text-sm text-muted-foreground">{feedback.count} avaliações válidas</span></div> : <p className="mt-3 text-sm text-muted-foreground">Esta empresa ainda não recebeu avaliações.</p>}
            <div className="mt-5 space-y-5">{feedback?.recent.map((review) => <blockquote key={review.id} className="border-t border-border pt-4"><div className="flex items-center justify-between"><span className="text-sm font-medium">{review.client_name ?? "Cliente"}</span><span className="flex items-center gap-1 text-sm"><Star className="h-3.5 w-3.5 fill-primary text-primary" />{review.rating.toFixed(1)}</span></div>{review.comment && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{review.comment}</p>}</blockquote>)}</div>
          </aside>
        </section>
      </main>
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 p-4 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4"><div className="hidden sm:block"><p className="font-semibold">{company.nome}</p><p className="text-sm text-muted-foreground">Escolha serviços e consulte a agenda real.</p></div><Button size="lg" className="w-full sm:w-auto" onClick={schedule}><CalendarDays className="mr-2 h-5 w-5" />Agendar agora</Button></div></div>
    </div>
  );
}
