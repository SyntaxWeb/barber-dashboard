# Build e deploy

## Produção

O frontend acessa diretamente `https://api-atendimento.syntaxatendimento.com.br`.
O endereço está definido em `.env.production` e é o padrão dos argumentos de
build do Dockerfile e do Compose. Não há proxy de API no Nginx do frontend.

```bash
npm ci
npm run build
npm test
```

O Dockerfile também compila o frontend antes de criar a imagem Nginx:

```bash
docker compose up -d --build app
```

Use `PRODUCTION_API_URL` para sobrescrever o backend ao compilar pelo Compose,
sem herdar a URL local de `VITE_API_URL` do arquivo `.env`.
`VITE_GOOGLE_CLIENT_ID` pode ser informado no ambiente antes do build.
Variáveis Vite são incorporadas durante a compilação; alterá-las exige novo build.

## Desenvolvimento local

`npm run dev` e `npm run build:local` usam `.env.development`.

## Verificação da API

```bash
curl -i -X OPTIONS https://api-atendimento.syntaxatendimento.com.br/api/login \
  -H 'Origin: https://syntaxatendimento.com.br' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type'
```

O resultado esperado é HTTP 204 e o cabeçalho
`Access-Control-Allow-Origin: https://syntaxatendimento.com.br`.
A API precisa estar acessível publicamente por HTTPS e permitir a origem do painel.
No navegador, o login deve chamar diretamente o domínio da API, com `/api/login`.
