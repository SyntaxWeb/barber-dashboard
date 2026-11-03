# Revisão de efeitos e estabilidade visual

Revisão em 02/11/2026. Escopo: todos os `useEffect` e `useLayoutEffect` do frontend, incluindo componentes compartilhados e hooks próprios.

Inventário atual: 73 efeitos em 37 arquivos. O polling de notificações e pagamentos foi centralizado em `usePolling` e também foi revisado.

## Problemas corrigidos

- Layout responsivo iniciava como desktop e mudava depois do primeiro desenho. Agora a largura é obtida na inicialização e usa o mesmo media query do CSS, com compatibilidade com listeners antigos do Safari.
- Atualização da sessão do prestador podia ativar a paleta de dashboard numa rota do cliente. A rota agora decide a paleta; sua aplicação ocorre antes da pintura e evita reescrever variáveis iguais.
- Consultas de horários, perfis públicos, assinatura, dashboard, configurações e administração podiam terminar depois da navegação ou sobrescrever uma consulta mais nova. Foram adicionadas invalidação e checagem antes dos commits de estado.
- Polling de Pix podia sobrepor consultas lentas e reiniciar com mudanças na identidade de callbacks. Agora usa ciclo sequencial, callback atualizado sem reiniciar o timer, pausa ao ocultar a aba e sinal de cancelamento por contexto.
- Notificações preservam a lista durante o polling, ignoram resultados após a saída e não acumulam consultas enquanto o dispositivo está suspenso.
- Alterar o telefone de destino nas configurações disparava novamente a consulta de conexão do WhatsApp. Essa dependência foi removida.
- Revalidação da sessão passou a limitar eventos rápidos de visibilidade. Resposta 401 de uma requisição cancelada ou de um token antigo não encerra outra sessão.
- Formulários de perfil preservam rascunhos durante atualizações da sessão. URLs temporárias de imagem são liberadas na substituição e desmontagem.
- Listeners de carregamento do Google e reInit de carrossel passaram a ter remoção simétrica.
- Promessas disparadas em efeitos que não tratavam falha passaram a tratar rejeição sem deixar carregamento preso. Leituras da API têm limite de espera de 30 segundos para a resposta HTTP.
- Navegação com páginas carregadas sob demanda usa transição do React Router para evitar trocar a tela atual pelo fallback durante o carregamento do módulo.
- O HTML servido pelo Nginx passa a exigir revalidação de cache; arquivos de assets ausentes retornam 404 em vez de HTML. Os assets da versão local anterior foram preservados neste deploy para abas que já estavam abertas.

- O acesso a localStorage/sessionStorage agora trata bloqueio de privacidade/quota sem derrubar a renderização. O login do cliente deixou de aguardar a localização para navegar e trata falhas de rede liberando os botões.

## Inventário inspecionado

| Arquivo | Efeitos |
| --- | ---: |
| `src/App.tsx` | 1 |
| `src/components/agenda/AppointmentModal.tsx` | 1 |
| `src/components/auth/GoogleClientButton.tsx` | 3 |
| `src/components/layout/Layout.tsx` | 2 |
| `src/components/ui/carousel.tsx` | 2 |
| `src/components/ui/sidebar.tsx` | 1 |
| `src/contexts/AuthContext.tsx` | 3 |
| `src/contexts/ClientAuthContext.tsx` | 4 |
| `src/contexts/ThemeContext.tsx` | 1 |
| `src/hooks/use-mobile.tsx` | 1 |
| `src/hooks/use-polling.ts` | 2 |
| `src/hooks/use-request-guard.ts` | 1 |
| `src/hooks/use-toast.ts` | 1 |
| `src/pages/AdminLogs.tsx` | 1 |
| `src/pages/AdminUsuarios.tsx` | 2 |
| `src/pages/Agenda.tsx` | 3 |
| `src/pages/Assinatura.tsx` | 1 |
| `src/pages/Caixa.tsx` | 1 |
| `src/pages/ClienteAgendamento.tsx` | 5 |
| `src/pages/ClienteAgendamentos.tsx` | 5 |
| `src/pages/ClienteBarbearias.tsx` | 1 |
| `src/pages/ClienteDashboard.tsx` | 2 |
| `src/pages/ClienteLogin.tsx` | 1 |
| `src/pages/ClientePerfil.tsx` | 2 |
| `src/pages/ClienteRegistro.tsx` | 4 |
| `src/pages/Clientes.tsx` | 1 |
| `src/pages/Configuracoes.tsx` | 5 |
| `src/pages/Dashboard.tsx` | 2 |
| `src/pages/Estoque.tsx` | 2 |
| `src/pages/Explorar.tsx` | 1 |
| `src/pages/FeedbackPublico.tsx` | 1 |
| `src/pages/Login.tsx` | 1 |
| `src/pages/NotFound.tsx` | 1 |
| `src/pages/NovoAgendamento.tsx` | 4 |
| `src/pages/Perfil.tsx` | 2 |
| `src/pages/PublicAgendamento.tsx` | 1 |
| `src/pages/Relatorios.tsx` | 1 |

Efeitos síncronos de normalização de seleção, parâmetros de URL, redirecionamento, galeria e inscrição de toast foram mantidos quando possuem dependências estáveis e atualização condicionada. Não foi removida a validação funcional dos horários.

## Verificação

- `npm run lint:effects`: regras de hooks e dependências em todo o `src`, sem desabilitar dependências por conveniência. O lint geral contém outras 28 ocorrências fora dessas regras; esta verificação específica de efeitos passa.
- `npx tsc --noEmit -p tsconfig.app.json`: checagem de tipos.
- `npm test`: 17 testes de regressão, em cinco arquivos, com React Testing Library/JSDOM. Incluem StrictMode, requisições fora de ordem, suspensão/retorno, listeners antigos, preservação de formulário, timeout, armazenamento bloqueado e conflito entre sessão/paleta.
- `npm run build:local`: build apontado para a API local.

Não houve reprodução em um tablet físico. Os testes simulam eventos e ciclos de componentes; não comprovam ausência de problemas específicos de GPU, navegador ou sistema operacional. Para validar o relato original, repetir as telas no dispositivo afetado, incluindo alternância de aplicativos, rotação e rede lenta.
