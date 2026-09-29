import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck2,
  CreditCard,
  Gift,
  LogIn,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  Star,
  Store,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import defaultLogo from "@/assets/syntax-logo.svg";
import heroImage from "@/assets/login-barber-background.png";

const clientBenefits = [
  { icon: Search, title: "Descubra lugares", description: "Busque por nome, região, serviço, preço e avaliação." },
  { icon: MapPin, title: "Encontre por perto", description: "Use sua localização ou informe cidade e bairro manualmente." },
  { icon: CalendarCheck2, title: "Agende em tempo real", description: "Escolha serviços e consulte horários realmente disponíveis." },
  { icon: Star, title: "Compare experiências", description: "Veja avaliações de clientes com atendimentos concluídos." },
];

const providerBenefits = [
  { icon: CalendarCheck2, title: "Agenda e clientes", description: "Agendamentos, bloqueios, histórico e remarcações em um só fluxo." },
  { icon: CreditCard, title: "Caixa e Pix", description: "Fechamento de atendimentos, vendas e pagamentos Mercado Pago." },
  { icon: Package, title: "Produtos e estoque", description: "Movimentações, estoque mínimo, custos e preços de venda." },
  { icon: BarChart3, title: "Relatórios", description: "Acompanhe receita, desempenho, clientes e avaliações." },
  { icon: Gift, title: "Fidelidade", description: "Pontos, recompensas e resgates ligados ao histórico do cliente." },
  { icon: Store, title: "Perfil público", description: "Galeria, serviços, endereço, avaliações e agenda online." },
];

const pricingPlans = [
  { name: "Mensal", price: "R$ 30", period: "/ mês", description: "Para começar com toda a operação organizada." },
  { name: "Trimestral", price: "R$ 90", period: "/ 3 meses", description: "Todas as funcionalidades com o trimestre resolvido.", highlighted: true },
  { name: "Anual", price: "R$ 360", period: "/ ano", description: "Previsibilidade para crescer durante o ano todo." },
];

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#f4f6f3] text-zinc-950">
      <header className="absolute inset-x-0 top-0 z-20 border-b border-white/20 bg-black/25 text-white backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <img src={defaultLogo} alt="SyntaxAtendimento" className="h-9 w-9 rounded-md bg-white p-1" />
            <span className="font-semibold">SyntaxAtendimento</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden text-white hover:bg-white/15 hover:text-white sm:inline-flex">
              <Link to="/cliente/login"><UserRound className="mr-2 h-4 w-4" />Login cliente</Link>
            </Button>
            <Button asChild className="bg-white text-zinc-950 hover:bg-white/90">
              <Link to={isAuthenticated ? "/dashboard" : "/login"}><LogIn className="mr-2 h-4 w-4" />{isAuthenticated ? "Abrir painel" : "Login prestador"}</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="relative flex min-h-[calc(100svh-2rem)] items-end overflow-hidden bg-zinc-950 text-white">
        <img src={heroImage} alt="Profissional atendendo em uma barbearia" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-black/65" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-32 sm:px-6 sm:pb-20">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase text-emerald-300">Beleza, agenda e gestão conectadas</p>
            <h1 className="text-5xl font-bold leading-tight sm:text-6xl">SyntaxAtendimento</h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-200">
              Clientes encontram barbearias e estúdios, comparam serviços e agendam. Prestadores administram agenda,
              clientes, pagamentos, estoque e fidelidade em uma única plataforma.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400" onClick={() => navigate("/explorar")}>
                <Search className="mr-2 h-5 w-5" />Encontrar um atendimento
              </Button>
              <Button size="lg" variant="outline" className="border-white/50 bg-black/20 text-white hover:bg-white hover:text-zinc-950" onClick={() => navigate(isAuthenticated ? "/dashboard" : "/registro")}>
                <Store className="mr-2 h-5 w-5" />{isAuthenticated ? "Ir para o painel" : "Cadastrar meu negócio"}
              </Button>
            </div>
            <Button asChild variant="link" className="mt-3 px-0 text-white sm:hidden">
              <Link to="/cliente/login">Já sou cliente: entrar <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-0 px-4 sm:grid-cols-3 sm:px-6">
          {["Busca por proximidade", "Disponibilidade em tempo real", "Gestão completa do negócio"].map((item, index) => (
            <div key={item} className={`flex min-h-24 items-center gap-3 py-5 sm:px-6 ${index > 0 ? "border-t border-zinc-200 sm:border-l sm:border-t-0" : ""}`}>
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" /><p className="font-medium">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[340px_1fr]">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-700">Para clientes</p>
            <h2 className="mt-3 text-3xl font-bold">Seu próximo atendimento começa pela escolha certa.</h2>
            <p className="mt-4 leading-relaxed text-zinc-600">Uma conta para descobrir, agendar e acompanhar atendimentos em várias empresas.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => navigate("/explorar")}><Search className="mr-2 h-4 w-4" />Explorar</Button>
              <Button variant="outline" onClick={() => navigate("/cliente/login")}><LogIn className="mr-2 h-4 w-4" />Login cliente</Button>
            </div>
          </div>
          <div className="grid gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 sm:grid-cols-2">
            {clientBenefits.map((benefit) => <article key={benefit.title} className="min-h-44 bg-white p-6"><benefit.icon className="h-7 w-7 text-emerald-600" /><h3 className="mt-5 text-lg font-semibold">{benefit.title}</h3><p className="mt-2 text-sm leading-relaxed text-zinc-600">{benefit.description}</p></article>)}
          </div>
        </div>
      </section>

      <section className="bg-zinc-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl"><p className="text-sm font-semibold uppercase text-[#ff8d76]">Para prestadores</p><h2 className="mt-3 text-3xl font-bold">Da agenda ao caixa, sem perder o histórico.</h2><p className="mt-4 text-zinc-300">Ferramentas para operar o dia, atender melhor e tomar decisões com dados reais.</p></div>
            <div className="flex gap-3"><Button variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white hover:text-zinc-950" onClick={() => navigate("/login")}>Login prestador</Button><Button className="bg-[#ff8d76] text-zinc-950 hover:bg-[#ffad9d]" onClick={() => navigate("/registro")}>Criar conta</Button></div>
          </div>
          <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-white/15 bg-white/15 md:grid-cols-2 lg:grid-cols-3">
            {providerBenefits.map((benefit) => <article key={benefit.title} className="min-h-44 bg-zinc-950 p-6"><benefit.icon className="h-7 w-7 text-[#ff8d76]" /><h3 className="mt-5 text-lg font-semibold">{benefit.title}</h3><p className="mt-2 text-sm leading-relaxed text-zinc-400">{benefit.description}</p></article>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="text-center"><p className="text-sm font-semibold uppercase text-emerald-700">Planos para prestadores</p><h2 className="mt-3 text-3xl font-bold">Toda a operação em um único plano.</h2><p className="mt-3 text-zinc-600">Escolha o período. As funcionalidades permanecem disponíveis em todos eles.</p></div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {pricingPlans.map((plan) => <article key={plan.name} className={`rounded-lg border p-7 ${plan.highlighted ? "border-emerald-600 bg-emerald-50" : "border-zinc-200 bg-white"}`}><p className="text-sm font-semibold uppercase text-emerald-700">{plan.name}</p><p className="mt-5"><span className="text-4xl font-bold">{plan.price}</span><span className="text-zinc-500"> {plan.period}</span></p><p className="mt-3 min-h-12 text-sm text-zinc-600">{plan.description}</p><ul className="mt-6 space-y-3 text-sm"><li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" />Agenda, clientes e perfil público</li><li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" />Caixa, estoque e relatórios</li><li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" />Fidelidade e integrações</li></ul><Button className="mt-7 w-full" variant={plan.highlighted ? "default" : "outline"} onClick={() => navigate(isAuthenticated ? "/dashboard" : "/registro")}>{isAuthenticated ? "Abrir painel" : "Começar agora"}</Button></article>)}
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-7 px-4 py-12 sm:px-6 md:flex-row md:items-center">
          <div><h2 className="text-2xl font-bold">Qual acesso você procura?</h2><p className="mt-2 text-zinc-600">Entre na área certa e continue de onde parou.</p></div>
          <div className="flex flex-col gap-3 sm:flex-row"><Button size="lg" variant="outline" onClick={() => navigate("/cliente/login")}><UserRound className="mr-2 h-5 w-5" />Entrar como cliente</Button><Button size="lg" onClick={() => navigate(isAuthenticated ? "/dashboard" : "/login")}><Store className="mr-2 h-5 w-5" />Entrar como prestador</Button></div>
        </div>
      </section>

      <footer className="bg-zinc-950 px-4 py-8 text-sm text-zinc-400 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><img src={defaultLogo} alt="" className="h-7 w-7 rounded bg-white p-1" /><span>© 2026 SyntaxAtendimento</span></div><div className="flex gap-5"><Link to="/explorar" className="hover:text-white">Explorar</Link><Link to="/cliente/login" className="hover:text-white">Login cliente</Link><Link to="/login" className="hover:text-white">Login prestador</Link><Link to="/politica-de-privacidade" className="hover:text-white">Privacidade</Link></div></div>
      </footer>
    </div>
  );
}
