import { Button } from "@/components/ui/button";
import {
  BarChart3,
  BellRing,
  CalendarRange,
  CreditCard,
  Gift,
  MessageCircle,
  Package,
  Scissors,
  Shield,
  Sparkles,
  Star,
  UserPlus,
  Users2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import defaultLogo from "@/assets/syntax-logo.svg";

const featureCards = [
  {
    title: "Agenda online e interna",
    description: "Receba agendamentos pelo link publico, crie encaixes pela equipe e acompanhe status por horario.",
    icon: CalendarRange,
  },
  {
    title: "Clientes com historico",
    description: "Centralize dados, atendimentos anteriores, preferencias, saldo de fidelidade e feedbacks.",
    icon: UserPlus,
  },
  {
    title: "Caixa integrado",
    description: "Feche atendimentos, registre vendas livres, gere Pix Mercado Pago e mantenha o historico financeiro.",
    icon: CreditCard,
  },
  {
    title: "Produtos e estoque",
    description: "Controle produtos, preco de venda, estoque minimo e ajustes de quantidade sem sair do painel.",
    icon: Package,
  },
  {
    title: "Relatorios da operacao",
    description: "Acompanhe receita, caixas fechados, agenda, clientes, avaliacoes e ranking de desempenho.",
    icon: BarChart3,
  },
  {
    title: "Fidelidade e recompensas",
    description: "Crie regras de pontos, recompensas com imagem e resgates acompanhados pelo prestador.",
    icon: Gift,
  },
  {
    title: "Avaliacoes dos clientes",
    description: "Colete notas e comentarios depois do atendimento e exiba feedbacks publicados no portal.",
    icon: Star,
  },
  {
    title: "Equipe e configuracoes",
    description: "Organize servicos, profissionais, bloqueios, galeria da empresa e canais de notificacao.",
    icon: Users2,
  },
];

const automationCards = [
  {
    title: "Notificacoes operacionais",
    description: "Alertas por e-mail, Telegram e WhatsApp ajudam a equipe a acompanhar novos agendamentos.",
    icon: MessageCircle,
  },
  {
    title: "Lembretes e pos-atendimento",
    description: "Convites de feedback, lembretes de retorno e comunicacoes automaticas reduzem trabalho manual.",
    icon: BellRing,
  },
];

const pricingPlans = [
  {
    name: "Plano Mensal",
    price: "R$ 30,00 / mes",
    description: "Ideal para comecar com a operacao organizada.",
    features: ["Agenda, clientes e painel liberados", "Caixa e estoque incluidos", "Sem taxa de implantacao"],
  },
  {
    name: "Plano Trimestral",
    price: "R$ 90,00 / 3 meses",
    description: "Para quem prefere manter o trimestre ja resolvido.",
    features: ["Todas as funcionalidades ativas", "Relatorios e fidelidade incluidos", "Pagamento recorrente pelo Mercado Pago"],
    highlighted: true,
  },
  {
    name: "Plano Anual",
    price: "R$ 360,00 / ano",
    description: "Para barbearias que querem previsibilidade o ano todo.",
    features: ["12 meses de acesso", "Integracoes e melhorias continuas", "Migracao simples entre planos"],
  },
];

const heroStats = [
  { label: "Agenda", value: "Online", description: "link publico para clientes" },
  { label: "Pagamentos", value: "Pix", description: "Mercado Pago no caixa" },
  { label: "Gestao", value: "360", description: "clientes, estoque e relatorios" },
];

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const primaryCta = () => navigate(isAuthenticated ? "/dashboard" : "/registro");
  const secondaryCta = () => navigate(isAuthenticated ? "/dashboard" : "/login");

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(248,191,59,0.28),_rgba(15,23,42,0.94)_48%,_rgba(12,74,110,0.55))]" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 lg:flex-row lg:items-center lg:py-20">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/20 px-4 py-1 text-sm uppercase tracking-[0.3em] text-amber-300">
              <img src={defaultLogo} alt="SyntaxAtendimento" className="h-7 w-7 rounded-full bg-white p-1" />
              SyntaxAtendimento
            </div>
            <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              O painel completo para barbearias que vivem de agenda cheia.
            </h1>
            <p className="text-lg text-slate-200">
              Centralize agendamentos, clientes, caixa, estoque, avaliacoes e fidelidade em uma plataforma simples
              de usar no balcao, no celular e na rotina da equipe.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button onClick={primaryCta} size="lg" className="text-base">
                {isAuthenticated ? "Ir para o painel" : "Comecar agora"}
              </Button>
              <Button onClick={secondaryCta} variant="secondary" size="lg" className="bg-white/10 text-white">
                {isAuthenticated ? "Continuar no painel" : "Ja tenho conta"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-slate-300">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-300" /> Atualizado com caixa, estoque e fidelidade
              </span>
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-300" /> Assinatura com Mercado Pago
              </span>
            </div>
          </div>

          <div className="flex flex-1 justify-center">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-900/30 backdrop-blur">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">Visao do dia</p>
                  <h2 className="text-xl font-semibold text-amber-200">Operacao em tempo real</h2>
                </div>
                <Scissors className="h-9 w-9 text-amber-300" />
              </div>
              <p className="mb-6 text-sm text-slate-200">
                Veja proximos horarios, caixas fechados, clientes atendidos e produtos movimentados em poucos cliques.
              </p>
              <div className="space-y-4">
                <div className="rounded-2xl bg-black/40 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-400">Hoje</p>
                  <p className="text-3xl font-bold text-white">Agenda + caixa</p>
                  <p className="text-sm text-emerald-300">atendimento concluido vira venda registrada</p>
                </div>
                <div className="grid gap-4 text-sm sm:grid-cols-3">
                  {heroStats.map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-white/10 bg-black/30 p-3">
                      <p className="text-slate-400">{stat.label}</p>
                      <p className="text-2xl font-semibold text-white">{stat.value}</p>
                      <p className="text-xs text-slate-400">{stat.description}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-50">
                  Portal do cliente com agendamento, historico, feedback e recompensas em um so lugar.
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="border-y border-white/10 bg-slate-900/70 px-6 py-10">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-amber-300">Para operar</p>
            <p className="mt-2 text-2xl font-bold">Agenda, equipe e clientes conectados.</p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-amber-300">Para vender</p>
            <p className="mt-2 text-2xl font-bold">Caixa, Pix, produtos e historico financeiro.</p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-amber-300">Para crescer</p>
            <p className="mt-2 text-2xl font-bold">Relatorios, fidelidade e avaliacoes reais.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-12 text-center">
          <p className="text-sm uppercase tracking-[0.5em] text-amber-300">Funcionalidades principais</p>
          <h2 className="mt-4 text-4xl font-bold text-white">Recursos atuais do SyntaxAtendimento</h2>
          <p className="mt-2 text-slate-300">
            A landing agora mostra o que a plataforma ja entrega para barbearias e equipes de atendimento.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {featureCards.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-6 shadow-[-20px_-20px_80px_rgba(15,23,42,0.35)]"
            >
              <feature.icon className="mb-4 h-10 w-10 text-amber-300" />
              <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900/60 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <p className="text-sm uppercase tracking-[0.5em] text-amber-300">Automacoes</p>
            <h2 className="mt-4 text-4xl font-bold text-white">Menos tarefas repetidas no atendimento</h2>
            <p className="mt-2 text-slate-300">
              Notificacoes, lembretes e pos-atendimento ajudam sua equipe a manter o cliente informado.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {automationCards.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-amber-400/20 bg-black/40 p-6 shadow-xl">
                <span className="mb-4 inline-flex items-center rounded-full border border-amber-400/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200">
                  Disponivel na operacao
                </span>
                <feature.icon className="mb-4 h-10 w-10 text-amber-300" />
                <h3 className="text-2xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-slate-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-900/50 px-6 py-20">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm uppercase tracking-[0.5em] text-amber-300">Planos</p>
          <h2 className="mt-4 text-4xl font-bold text-white">Escolha o plano ideal para sua operacao</h2>
          <p className="mt-2 text-slate-300">
            Planos conforme a configuracao atual da plataforma, com checkout recorrente pelo Mercado Pago.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border ${
                  plan.highlighted ? "border-amber-400/80 bg-amber-400/10 shadow-xl" : "border-white/15 bg-white/5"
                } p-8 text-left backdrop-blur`}
              >
                <p className="text-sm uppercase tracking-[0.3em] text-amber-300">{plan.name}</p>
                <p className="mt-4 text-3xl font-black text-white">{plan.price}</p>
                <p className="mt-2 text-sm text-slate-300">{plan.description}</p>
                <ul className="mt-6 space-y-3 text-sm text-slate-200">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-300" /> {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  className="mt-8 w-full"
                  variant={plan.highlighted ? "default" : "secondary"}
                  onClick={primaryCta}
                >
                  {isAuthenticated ? "Abrir painel" : "Comecar agora"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950 px-6 py-8 text-sm text-slate-400">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 SyntaxAtendimento</span>
          <Link to="/politica-de-privacidade" className="font-medium text-slate-200 hover:text-amber-300">
            Politica de Privacidade
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
