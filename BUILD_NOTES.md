# Build Notes

## Build de producao do frontend

Quando o ambiente nao tiver `node`, `npm` ou `bun` instalados no host, o build do `dist` pode ser gerado via Docker usando o `Dockerfile` do projeto.

### Comando usado

```bash
docker build \
  --target builder \
  --build-arg VITE_API_URL=https://api-atendimento.syntaxatendimento.com.br \
  --build-arg VITE_GOOGLE_CLIENT_ID=327557297306-r5uqehqqeshc3nd0u7aal6pa2co86t09.apps.googleusercontent.com \
  -t barber-dashboard-builder .
```

### Fluxo que foi feito

1. Gerar a imagem do stage `builder`.
2. Criar um container temporario:

```bash
docker create --name barber-dashboard-dist barber-dashboard-builder
```

3. Fazer backup do `dist` anterior:

```bash
mv /home/dev/projects/barber-dashboard/dist /home/dev/projects/barber-dashboard/dist.backup-YYYYMMDD-1
```

4. Copiar o `dist` gerado do container para fora.

Se `docker cp` falhar por permissao no `dist/assets`, copiar primeiro para `/tmp`:

```bash
docker cp barber-dashboard-dist:/app/dist /tmp/
mv /tmp/dist /home/dev/projects/barber-dashboard/dist
```

### Resultado mais recente

- Build gerado com sucesso em `/home/dev/projects/barber-dashboard/dist`
- Backup anterior salvo como `/home/dev/projects/barber-dashboard/dist.backup-20260324-1`

### Observacao

O build pode mostrar aviso de chunk JS grande no Vite. Isso nao impede a geracao do `dist`, mas vale otimizar depois com code splitting.
