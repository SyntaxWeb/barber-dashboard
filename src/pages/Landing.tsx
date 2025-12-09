import { Button } from "@/components/ui/button";
import {
  BellRing,
  CalendarCheck,
  CalendarRange,
  MessageCircle,
  Shield,
  Sparkles,
  UserPlus,
  Repeat,
  Users2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const featureCards = [
  {
    title: "Cadastro de clientes e leads",
    description: "Registre clientes de beleza, saúde, estética ou consultoria com histórico e preferências.",
    icon: UserPlus,
  },
  {
    title: "Gerenciador de agendamentos",
    description: "Monte horários, bloqueios, encaixes e confirmações automáticas em uma única tela.",
    icon: CalendarRange,
  },
  {
    title: "Indicadores operacionais",
    description: "Acompanhe presença confirmada, ticket médio estimado e ocupação do dia em tempo real.",
    icon: CalendarCheck,
  },
  {
    title: "Fluxos recorrentes",
    description: "Configure planos mensais de atendimento, renovações automáticas e lembretes de retorno.",
    icon: Repeat,
  },
  {
    title: "Equipe conectada",
    description: "Delegue atendimentos, acompanhe metas de cada profissional e mantenha tudo sincronizado.",
    icon: Users2,
  },
];

const roadmapCards = [
  {
    title: "Integração com WhatsApp",
    description: "Envio automático de confirmações e lembretes usando o número oficial da barbearia.",
    icon: MessageCircle,
  },
  {
    title: "Alertas automáticos aos clientes",
    description: "Notificações inteligentes sobre horários, atrasos e reaberturas de vagas.",
    icon: BellRing,
  },
];

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const primaryCta = () => navigate(isAuthenticated ? "/dashboard" : "/registro");
  const secondaryCta = () => navigate(isAuthenticated ? "/dashboard" : "/login");

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(248,191,59,0.35),_rgba(15,23,42,0.9))]" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-6">
            <span className="inline-flex items-center rounded-full border border-white/20 px-4 py-1 text-sm uppercase tracking-[0.3em] text-amber-300">
              SyntaxAtendimento
            </span>
            <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              Organize seu negócio com um painel moderno e descomplicado.
            </h1>
            <p className="text-lg text-slate-200">
              Centralize agendamentos, cadastros e indicadores em uma plataforma construída para barbearias,
              estúdios de beleza, clínicas e consultorias que não podem parar.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button onClick={primaryCta} size="lg" className="text-base">
                {isAuthenticated ? "Ir para o painel" : "Começar agora"}
              </Button>
              <Button onClick={secondaryCta} variant="secondary" size="lg" className="bg-white/10 text-white">
                {isAuthenticated ? "Continuar no painel" : "Já tenho conta"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-slate-300">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-300" /> +3.000 agendamentos processados
              </span>
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-300" /> Infraestrutura segura
              </span>
            </div>
          </div>
          <div className="flex flex-1 justify-center">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-amber-500/20 backdrop-blur">
              <h2 className="mb-4 text-xl font-semibold text-amber-200">Painel em tempo real</h2>
              <p className="mb-6 text-sm text-slate-200">
                Visualize a ocupação do dia, status de confirmação e desempenho financeiro em segundos.
              </p>
              <div className="space-y-4">
                <div className="rounded-2xl bg-black/40 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-400">Hoje</p>
                  <p className="text-3xl font-bold text-white">18 atendimentos</p>
                  <p className="text-sm text-emerald-300">+4 novos clientes</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                    <p className="text-slate-400">Taxa de confirmação</p>
                    <p className="text-2xl font-semibold text-white">96%</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                    <p className="text-slate-400">Ticket médio</p>
                    <p className="text-2xl font-semibold text-white">R$ 89</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-12 text-center">
          <p className="text-sm uppercase tracking-[0.5em] text-amber-300">Funcionalidades principais</p>
          <h2 className="mt-4 text-4xl font-bold text-white">Tudo o que já está pronto para a sua equipe</h2>
          <p className="mt-2 text-slate-300">
            Recursos ativos e em uso por barbearias, clínicas, estúdios e qualquer operação baseada em agenda.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {featureCards.map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-6 shadow-[-20px_-20px_80px_rgba(15,23,42,0.35)]"
            >
              <feature.icon className="mb-4 h-10 w-10 text-amber-300" />
              <h3 className="text-2xl font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-slate-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900/60 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <p className="text-sm uppercase tracking-[0.5em] text-amber-300">Em desenvolvimento</p>
            <h2 className="mt-4 text-4xl font-bold text-white">Próximas funcionalidades</h2>
            <p className="mt-2 text-slate-300">
              Estamos acelerando novas integrações e automações para ampliar o contato com seus clientes.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {roadmapCards.map((feature) => (
              <div key={feature.title} className="rounded-3xl border border-amber-400/20 bg-black/40 p-6 shadow-xl">
                <span className="mb-4 inline-flex items-center rounded-full border border-amber-400/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200">
                  Em desenvolvimento
                </span>
                <feature.icon className="mb-4 h-10 w-10 text-amber-300" />
                <h3 className="text-2xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-slate-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/15 bg-gradient-to-r from-amber-400/20 via-orange-500/10 to-rose-500/10 p-10 text-center shadow-2xl">
          <p className="text-sm uppercase tracking-[0.4em] text-amber-200">Pronto para avançar?</p>
          <h2 className="mt-4 text-4xl font-black text-white">Comece grátis e migre quando quiser</h2>
          <p className="mt-3 text-lg text-slate-200">
            Cadastre sua operação em menos de 5 minutos e já importe a agenda atual. Sem cartão de crédito, sem
            burocracia.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" onClick={primaryCta} className="text-base">
              {isAuthenticated ? "Abrir painel" : "Criar conta gratuita"}
            </Button>
            {!isAuthenticated && (
              <Button size="lg" variant="outline" onClick={secondaryCta} className="border-white/40 text-white">
                Entrar
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
