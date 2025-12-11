# SyntaxAtendimento

Sistema completo criado pela [SyntaxWeb](https://syntaxweb.com.br) para digitalizar o atendimento de barbearias e estúdios de beleza. O painel centraliza o dia a dia da operação em um único lugar, permitindo:

- **Cadastro e gestão de clientes** com envio automático de convites via Telegram para que cada pessoa defina a própria senha e acesse o portal.
- **Agendamentos inteligentes**, com busca por clientes existentes, validação de horários livres, reaproveitamento de slots cancelados e atualização rápida de status.
- **Configurações públicas da empresa**, como nome, descrição, ícone, QR Code e link exclusivo de agendamento.
- **Portal público para clientes**, incluindo login, registro, visualização de serviços e confirmação de novos horários.

## Arquitetura

- **Frontend**: Vite + React + TypeScript, UI com shadcn + Tailwind.
- **Backend**: Laravel (API REST) com autenticação via Sanctum e integração para convites Telegram.
- **Banco de dados**: MySQL com controle de slots exclusivos por empresa.

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Executar ambiente de desenvolvimento
npm run dev
```

Backend Laravel (pasta `barber-api`):

```bash
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

## Deploy

- Frontend: build com `npm run build` e publicação via CDN, VPS ou serviço estático.
- Backend: deploy Laravel em VPS ou plataforma compatível (PHP 8.3+), apontando para o mesmo banco da aplicação.
- Configure `APP_URL` e `CORS_ALLOWED_ORIGINS` para refletirem os domínios de produção (`https://api-barberapp.syntaxweb.com.br`, `https://barberapp.syntaxweb.com.br`). 

## Suporte

Entre em contato com a SyntaxWeb em [https://syntaxweb.com.br](https://syntaxweb.com.br) para evoluções, integrações ou implantação do SyntaxAtendimento.
