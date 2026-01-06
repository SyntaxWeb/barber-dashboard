# Documentacao do Sistema SyntaxAtendimento (Barber Dashboard)

## 1. Visao geral
O SyntaxAtendimento e um sistema completo para digitalizar o atendimento de barbearias e estudios de beleza. Ele possui:
- Painel do prestador (dashboard): administracao de agenda, clientes, servicos, configuracoes e relatorios.
- Portal do cliente (publico e autenticado): agendamento, acompanhamento de horarios e envio de feedback.

O frontend (este repositorio) consome uma API REST (Laravel) e centraliza os fluxos de operacao e experiencia do cliente.

## 2. Arquitetura e stack
- Frontend: Vite + React + TypeScript.
- UI: shadcn + Tailwind.
- Estado e dados: React Query, hooks e services dedicados.
- Autenticacao: tokens via sessionStorage (secureStorage) + dados em localStorage.
- Backend: Laravel (API REST) com Sanctum.
- Banco: MySQL (controle de slots por empresa).

## 3. Perfis, papeis e acesso
- Provider (prestador): acesso ao dashboard e configuracoes da empresa.
- Admin (superadmin): acesso a usuarios, logs e relatorios do sistema.
- Cliente: acesso ao portal da empresa e gestao de agendamentos pessoais.

Rotas e protecoes:
- Rotas protegidas do dashboard exigem login (token valido).
- Providers sao bloqueados quando `subscription_status != "ativo"` e sao redirecionados para `/assinatura`.
- Admin possui rotas exclusivas: `/admin/usuarios`, `/admin/logs`.
- Cliente possui rotas exclusivas: `/cliente/*`.

## 4. Autenticacao e sessao
### Provider
- Login: `/api/login` (email/senha).
- Registro: `/api/register` (nome, email, empresa, telefone, objetivo, senha).
- Sessao: token salvo em `sessionStorage` (chave `barbeiro-token`) e usuario em `localStorage` (`barbeiro-user`).

### Cliente
- Login: `/api/clients/login` (email/senha + company_slug).
- Login Google: `/api/clients/login/google` (credential + company_slug).
- Registro: `/api/clients/register` (nome, email, telefone, senha + company_slug).
- Sessao: token salvo em `sessionStorage` (chave `cliente-token`), usuario em `localStorage` (`cliente-user`) e empresa ativa em `localStorage` (`cliente-company`).

## 5. Entidades principais
- Empresa: dados publicos, tema, icone, galeria, link de agendamento, contatos e notificacoes.
- Servico: nome, preco, duracao (minutos).
- Agendamento: cliente, telefone, data, horario, servico, preco, status, observacoes.
- Feedback: notas (servico, profissional, agendamento), comentario, autorizacao para depoimento publico.
- Assinatura: plano, status, preco, renovacao, pedidos pendentes.
- Notificacoes: eventos de agendamento (novo, atualizado, cancelado).

## 6. Funcionalidades do painel (prestador)
### Dashboard
- Indicadores do dia: agendamentos confirmados e concluidos, horarios livres, clientes atendidos, faturamento do dia.
- Proximo cliente com horario, servico e valor.
- Acesso rapido para agenda e clientes.

### Agenda
- Visualizacao mensal, semanal e diaria (FullCalendar).
- Cores por status: confirmado, concluido, cancelado.
- Modal com detalhes do agendamento, acao de concluir e cancelar.
- Lista de agendamentos do dia selecionado.

### Novo agendamento
- Busca e sugestao de clientes existentes.
- Validacao de campos obrigatorios.
- Listagem de horarios livres via `/api/availability`.
- Bloqueio de datas passadas.

### Clientes
- Cadastro manual de clientes com nome, email, telefone e observacoes.
- Busca por nome, email ou telefone.
- Convite automatico para o portal via link do Telegram com dados pre-preenchidos.

### Configuracoes
- Empresa: nome, descricao, icone, galeria, link publico e QR Code.
- Notificacoes: email, Telegram e WhatsApp (com chaves e toggles).
- Temas: cores do dashboard e do portal do cliente.
- Agenda: horario de funcionamento, intervalo, dias bloqueados, agenda semanal e almoco.
- Servicos: criacao e remocao de servicos com preco e duracao.

### Perfil
- Edicao de dados do prestador (nome, email, telefone, objetivo, senha, avatar).

### Relatorios
- Provider: visao consolidada dos ultimos 30 dias (agendamentos, receita, feedback, tendencias).
- Admin: visao do sistema (empresas, clientes, planos, status, receita agregada).

### Assinatura
- Exibe plano atual, status, valor e data de renovacao.
- Permite iniciar checkout de plano e continuar pagamentos pendentes.
- Quando a assinatura esta pendente, o painel fica bloqueado ate regularizacao.

### Notificacoes
- Sinalizacao de novos agendamentos, atualizacoes e cancelamentos.
- Marcar notificacao individual como lida ou todas de uma vez.

## 7. Funcionalidades do portal do cliente
### Portal publico da empresa
- Pagina `/e/:slug/agendar` carrega dados publicos da empresa.
- Define o `company` para o fluxo do cliente (registro e login).

### Login e registro
- Registro obrigatorio com empresa valida (company_slug).
- Login tradicional e com Google.
- Dados podem ser pre-preenchidos via convite (nome, email, telefone).

### Agendamento
- Escolha de servico, data, horario e observacoes.
- Horarios livres consultados via `/api/availability`.
- Datas passadas sao bloqueadas.

### Meus agendamentos
- Lista de todos os agendamentos do cliente.
- Remarcar ou cancelar apenas se:
  - Status = confirmado
  - Faltam pelo menos 60 minutos para o horario marcado
- Feedback disponivel somente para agendamentos concluidos.

### Feedback publico
- Link com token permite enviar feedback sem login.
- Se ja existe feedback, o sistema bloqueia novo envio.
- Cliente pode autorizar depoimento publico.

## 8. Regras de negocio (resumo)
1. Status de agendamento:
   - confirmado, concluido, cancelado.
   - Apenas confirmado pode ser concluido ou cancelado pelo prestador.
2. Disponibilidade de horarios:
   - Baseada em configuracoes da agenda, intervalos e dias bloqueados.
   - Endpoints de disponibilidade consideram empresa, servico e (em edicao) appointment_id.
3. Cancelamento e remarcacao pelo cliente:
   - Permitido ate 60 minutos antes do horario.
4. Feedback:
   - Somente para agendamentos concluidos.
   - Pode ser publico apenas com autorizacao explicita.
5. Assinatura:
   - Provider com status diferente de "ativo" nao acessa o painel completo.
6. Convite de cliente:
   - Cadastro manual dispara link de convite via Telegram com dados pre-preenchidos.
7. Acesso de cliente:
   - Sempre associado a uma empresa via `company_slug`.

## 9. Integracoes
- Telegram:
  - Geracao e verificacao de link para notificacoes.
  - Convite de clientes via URL pronta para envio.
- WhatsApp:
  - Sessao com QR Code, status, telefone e logout.
- Google:
  - Login e registro do cliente via Google.
- Mercado Pago:
  - Checkout de assinatura e sincronizacao de planos (admin).

## 10. Endpoints consumidos no frontend (principais)
### Autenticacao
- POST `/api/login`
- POST `/api/register`
- POST `/api/clients/login`
- POST `/api/clients/login/google`
- POST `/api/clients/register`

### Agenda e servicos
- GET `/api/appointments`
- GET `/api/appointments?date=YYYY-MM-DD`
- GET `/api/appointments?from=YYYY-MM-DD&to=YYYY-MM-DD`
- POST `/api/appointments`
- PUT `/api/appointments/:id`
- POST `/api/appointments/:id/status` (status: cancelado/concluido)
- GET `/api/services`
- POST `/api/services`
- PUT `/api/services/:id`
- DELETE `/api/services/:id`
- GET `/api/availability?date=YYYY-MM-DD&company=slug&service_id=ID&appointment_id=ID`

### Configuracoes
- GET `/api/settings`
- PUT `/api/settings`
- GET `/api/company`
- POST `/api/company` (FormData, inclui icone, galerias e temas)
- POST `/api/company/telegram/link`
- POST `/api/company/telegram/link/verify`
- GET `/api/company/whatsapp/session`
- POST `/api/company/whatsapp/session`
- DELETE `/api/company/whatsapp/session`

### Clientes (prestador)
- GET `/api/clients`
- POST `/api/clients`

### Portal cliente
- GET `/api/services?company=slug`
- GET `/api/availability?date=YYYY-MM-DD&company=slug&service_id=ID`
- POST `/api/appointments` (com company_slug)
- GET `/api/clients/appointments`
- PUT `/api/clients/appointments/:id`
- POST `/api/clients/appointments/:id/cancel`
- POST `/api/clients/appointments/:id/feedback`
- GET `/api/companies/:slug`
- GET `/api/companies/:slug/feedback-summary`
- GET `/api/feedback/form/:token`
- POST `/api/feedback/form/:token`

### Assinatura
- GET `/api/subscription`
- POST `/api/subscription/checkout`

### Relatorios
- GET `/api/company/report`
- GET `/api/admin/system/report` (ou `/api/admin/report`)

### Admin
- GET `/api/admin/providers`
- POST `/api/admin/providers/:id/subscription`
- GET `/api/admin/plans`
- GET `/api/admin/mercado-pago/subscriptions`
- POST `/api/admin/mercado-pago/plans/sync`
- GET `/api/admin/logs`

### Notificacoes
- GET `/api/notifications`
- POST `/api/notifications/:id/read`
- POST `/api/notifications/read-all`

## 11. Variaveis de ambiente
- `VITE_API_URL`: URL base da API.
- `VITE_GOOGLE_CLIENT_ID`: Client ID para login Google do portal.

## 12. Observacoes de seguranca
- Tokens ficam em sessionStorage (ou fallback in-memory).
- Dados do usuario ficam em localStorage para restaurar sessao.
- Todas as rotas privadas exigem token e role adequado.

## 13. Fluxos resumidos
### Prestador
1. Registra conta e entra no dashboard.
2. Contrata assinatura e desbloqueia painel.
3. Configura empresa, agenda e servicos.
4. Cadastra clientes e envia convite.
5. Gera e gerencia agendamentos.

### Cliente
1. Abre link publico da empresa.
2. Registra conta (ou login) associado ao `company`.
3. Agenda servico com horario disponivel.
4. Remarca ou cancela com antecedencia minima.
5. Envia feedback apos atendimento concluido.
