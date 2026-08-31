import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import defaultLogo from "@/assets/syntax-logo.svg";

const sections = [
  {
    title: "Dados que coletamos",
    text: "Coletamos dados informados no cadastro, como nome, email, telefone, dados da empresa, serviços, agenda, clientes e informações necessárias para operar agendamentos, caixa, pagamentos e notificações.",
  },
  {
    title: "Como usamos os dados",
    text: "Usamos as informações para autenticar usuários, organizar agendas, registrar atendimentos, gerar relatórios, processar pagamentos, enviar comunicações operacionais e melhorar a segurança da plataforma.",
  },
  {
    title: "Pagamentos e integrações",
    text: "Quando uma integração de pagamento é conectada, dados necessários à transação podem ser compartilhados com o provedor escolhido, como Mercado Pago, para criação de cobranças Pix, confirmação de pagamentos, conciliação e prevenção a fraude.",
  },
  {
    title: "Compartilhamento",
    text: "Não vendemos dados pessoais. Compartilhamos dados apenas com provedores necessários para funcionamento do serviço, cumprimento legal, segurança, processamento de pagamentos, hospedagem, comunicação ou suporte técnico.",
  },
  {
    title: "Segurança",
    text: "Adotamos medidas técnicas e administrativas para proteger as informações. Credenciais sensíveis de integrações são armazenadas de forma protegida e o acesso é restrito conforme perfil de usuário.",
  },
  {
    title: "Direitos do titular",
    text: "Você pode solicitar acesso, correção, exclusão, portabilidade ou revisão do tratamento de dados pessoais, conforme aplicável pela LGPD, entrando em contato pelos canais oficiais da plataforma.",
  },
];

export default function PoliticaPrivacidade() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 font-semibold">
            <img src={defaultLogo} alt="SyntaxAtendimento" className="h-9 w-9 rounded-full border border-border" />
            SyntaxAtendimento
          </Link>
          <Link to="/login" className="text-sm font-medium text-primary hover:underline">Entrar</Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Política de Privacidade</h1>
            <p className="mt-2 text-sm text-muted-foreground">Última atualização: 31/08/2026</p>
          </div>
        </div>

        <div className="space-y-6 text-sm leading-6 text-muted-foreground">
          <p>
            Esta Política de Privacidade descreve como o SyntaxAtendimento trata dados pessoais e operacionais
            utilizados na plataforma de agendamento, gestão de clientes, caixa, relatórios e integrações.
          </p>

          {sections.map((section) => (
            <section key={section.title} className="rounded-md border border-border bg-card p-5">
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              <p className="mt-2">{section.text}</p>
            </section>
          ))}

          <section className="rounded-md border border-border bg-card p-5">
            <h2 className="text-lg font-semibold text-foreground">Contato</h2>
            <p className="mt-2">
              Para solicitações sobre privacidade e proteção de dados, entre em contato pelo canal de suporte
              informado pela plataforma ou pelo responsável comercial do SyntaxAtendimento.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
