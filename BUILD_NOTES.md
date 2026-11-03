# Build e deploy

## Produção com Docker

O Dockerfile compila o frontend antes de criar a imagem Nginx. Não é necessário
gerar `dist` no host. O valor vazio de `VITE_API_URL` em produção faz as chamadas
usarem `/api` no domínio do painel. O Nginx encaminha `/api/` e `/storage/` à API
Laravel na porta publicada 8001 do mesmo host Docker.

Com a API em execução, publique o painel:

```bash
docker compose up -d --build app
```

A entrada `host.docker.internal:host-gateway` do Compose permite alcançar a API.
Ao executar a imagem sem Compose, informe também
`--add-host host.docker.internal:host-gateway`.

Para uma API hospedada em outro servidor, defina `PRODUCTION_API_URL` antes do
build. Nesse caso, configure CORS na API e `connect-src` no Nginx para esse domínio.
`VITE_GOOGLE_CLIENT_ID` pode ser informado no ambiente antes do build.
Variáveis Vite são incorporadas durante a compilação; alterá-las exige novo build.

## Build sem publicar

```bash
npm ci
npm run build
npm test
```

O `dist` usa `.env.production` e precisa do proxy acima ao ser servido.
`vite preview` sozinho não fornece esse proxy.

## Desenvolvimento local

```bash
npm run dev
```

O desenvolvimento usa `.env.development`, com a API configurada diretamente.
`npm run build:local` também usa esse ambiente; configure CORS na API para a
origem local utilizada.

## Verificação

```bash
curl -i http://127.0.0.1:4002/api/me -H 'Accept: application/json'
```

Sem token, o resultado esperado é HTTP 401 em JSON, nunca o HTML do frontend.
No navegador, o login deve chamar `/api/login` no mesmo domínio do painel.
Se a resposta for 502, confira a disponibilidade da API na porta 8001.
