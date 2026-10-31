# Arquitetura e decisões

## Visão geral

```
src/
├── api/          Funções HTTP (Axios). Única porta de saída para o REST.
├── auth/         Sessão, token e modal de login.
├── cart/         Hooks do carrinho e identificador do visitante.
├── checkout/     Hooks de carteiras e pedidos, chave de idempotência e rascunho.
├── realtime/     Cliente Socket.IO e aplicação dos eventos no cache.
├── queries/      Query keys e queryOptions do catálogo e favoritos.
├── components/   Interface (shadcn/ui adaptado ao tema do Kurio).
├── pages/        Telas ligadas às rotas.
├── lib/          Utilitários (ETH com bigint, labels, validação da URL, QueryClient).
├── types/        Contratos compartilhados entre mocks, estado e interface.
└── mocks/        MSW: handlers REST, servidor Socket.IO, banco simulado e cenários.
```

Componentes, hooks e o cliente Axios **não conhecem os mocks**. Toda resposta simulada vem do MSW, na camada de rede. O painel de cenários (`src/mocks/MockPanel.tsx`) só é carregado quando os mocks estão ligados e fala com a simulação por rotas `/api/__mock/*`.

## Contratos REST

Todas as rotas ficam sob `/api`. Os tipos estão em `src/types`.

| Recurso | Rota | Observações |
| --- | --- | --- |
| Sessão | `POST /auth/register` | 201 com `Session`; 400 `VALIDATION` com `fieldErrors`; 409 `CONFLICT` (e-mail ou usuário em uso) |
| | `POST /auth/login` | 200 com `Session`; 401 `UNAUTHORIZED` |
| | `GET /auth/session` | 200 com `Session`; 401 se inválida ou expirada |
| | `POST /auth/logout` | 204 |
| NFTs | `GET /nfts` | Query: `q`, `category` (repetível), `network` (repetível), `minPrice`, `maxPrice`, `tab`, `sort`, `page`. Responde `Paginated<Nft>`; 400 para parâmetros inválidos |
| | `GET /nfts/facets` | Contagens por coleção e rede e faixa de preço |
| | `GET /nfts/:nftId` | 200 com `Nft`; 404 `NOT_FOUND` |
| Favoritos | `GET /favorites`, `PUT` e `DELETE /favorites/:nftId` | Lista de ids do usuário autenticado |
| Carrinho | `GET /cart` | Sempre responde uma `Quote` calculada com os dados atuais |
| | `POST`, `PATCH`, `DELETE /cart/items` | 409 `CONFLICT` quando passa da disponibilidade da edição |
| | `POST` e `DELETE /cart/coupon` | 422 para cupom inválido ou expirado |
| | `POST /cart/merge` | Junta o carrinho do visitante ao do usuário no login |
| Cotação | (resposta do carrinho) | Subtotal, desconto, taxa de rede e total, com estoque atual por linha |
| Carteiras | `GET /wallets`, `POST /wallets/:id/connect` | 403 `FORBIDDEN` simula a recusa da carteira |
| Pedidos | `POST /orders` | Exige o cabeçalho `Idempotency-Key`. 409 `STALE_QUOTE` se preço, estoque, cupom ou taxa mudaram; 409 `CONFLICT` se a chave for reutilizada com outro conteúdo |
| | `GET /orders/:orderId` | 404 para pedido inexistente **ou de outro usuário** |

**Identificação:** o token vai em `Authorization: Bearer <token>`. O visitante é identificado pelo cabeçalho `X-Guest-Cart`, com um id aleatório guardado no navegador.

**Erros:** sempre `{ code, message, fieldErrors? }`. Códigos: `VALIDATION`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `STALE_QUOTE`, `UNAVAILABLE`. Falha de conexão vira `ApiError` com código `NETWORK` no interceptor do Axios.

**Valores em ETH:** trafegam como strings decimais. Todas as contas usam `bigint` em wei (18 casas), em `src/lib/eth.ts`, e nunca `number`.

## Eventos em tempo real

| Evento | Payload | Quem recebe |
| --- | --- | --- |
| `nft.updated` | `{ id, type, resourceId, version, data: { name, priceEth, editions } }` | Todas as conexões |
| `order.updated` | `{ id, type, resourceId, version, data: { userId, status } }` | Só a conexão do dono do pedido |

Todo evento tem **identidade estável** (`id`), **recurso afetado** (`resourceId`) e **versão**. Cada mudança de preço ou estoque no banco simulado sobe a versão do NFT e gera o evento, então REST e eventos sempre concordam.

O cliente se identifica emitindo `session` com o token logo após conectar.

### Transporte e limitações nos mocks

O servidor é simulado com `ws.link` do MSW e `@mswjs/socket.io-binding`, e o app usa o `socket.io-client` real com `transports: ['websocket']`.

- A binding exige **MSW 2**; o MSW 3 ainda não é compatível
- O endereço do link usa curinga (`wss://realtime.kurio.test/*`), porque o Socket.IO acrescenta `/socket.io/?EIO=4...`
- O `socket.io-client` precisa ser carregado **depois** que o MSW inicia. Por isso o `main.tsx` importa o `App` dinamicamente após `worker.start()`
- A binding não implementa namespaces, salas nem broadcast. O filtro por usuário é feito na simulação
- A binding não envia o ping do protocolo. A simulação envia o pacote `2` a cada 20s para o cliente não encerrar a conexão por timeout
- Polling (transporte HTTP do Socket.IO) não é usado

## Política de sessão

- O token fica no `localStorage`, para a sessão sobreviver a refresh. A sessão simulada expira em 30 minutos
- Na carga, `GET /auth/session` valida o token. Se a resposta for 401, o token é descartado
- Qualquer 401 de uma chamada autenticada dispara o evento `kurio:session-expired`. O app limpa a sessão e abre o modal de login **sem sair da tela**, então o usuário continua de onde parou. O rascunho do checkout fica no `sessionStorage` e é restaurado
- Todo dado privado mora no cache sob `['private', userId, ...]`. Logout, expiração e troca de usuário removem `['private']` inteiro antes de gravar a nova sessão
- O socket é recriado a cada troca de usuário: listeners antigos são removidos e eventos de outra sessão não chegam
- Senhas nunca são guardadas: a simulação armazena SHA-256 de `id:senha`

## Estado do carrinho

- O carrinho guarda só **o que** comprar: NFT, edição e quantidade. Preço, desconto, taxa e estoque são calculados pela API a cada leitura e voltam como uma `Quote`
- Toda mutation do carrinho responde a cotação nova, que substitui o cache (`setQueryData`), sem uma segunda requisição
- Visitante e usuário usam o mesmo código. No login, `POST /cart/merge` junta os itens do visitante aos do usuário, limitado ao estoque, e mantém o cupom
- A linha cuja quantidade passa do estoque atual mostra o problema e bloqueia "Conectar e finalizar"
- Após um pedido confirmado, saem do carrinho só os itens e as quantidades comprados. Pagamento recusado preserva o carrinho e devolve o estoque reservado

## Pedidos e idempotência

- A chave de idempotência é derivada do conteúdo do pedido e guardada no `sessionStorage`. Mesmo conteúdo reusa a mesma chave, inclusive depois de refresh ou timeout; conteúdo diferente gera chave nova
- A API devolve o **mesmo pedido** para a mesma chave e responde 409 se o conteúdo for diferente
- Antes de criar o pedido, a API recalcula a cotação e compara com os valores que o usuário aprovou (`expected`). Qualquer diferença responde `STALE_QUOTE`, e o app atualiza o carrinho e exige nova confirmação. O modal de revisão também avisa quando um evento muda os valores enquanto ele está aberto
- O botão de confirmar fica bloqueado durante o envio, e `handleConfirm` ignora cliques enquanto há um envio em andamento
- Estados: `pending` → `confirmed` ou `declined`. Estados finais não mudam mais
- O recibo é um **snapshot**: o pedido copia as linhas, os preços e os totais no momento da compra

## Estratégia de cache, retries e sincronização

| Dado | Query key | Política |
| --- | --- | --- |
| Lista de NFTs | `['nfts', 'list', params]` | `staleTime` 30s, `keepPreviousData` (a lista antiga fica visível, esmaecida, durante a troca) |
| Facetas | `['nfts', 'facets']` | `staleTime` 5min |
| Detalhe | `['nfts', 'detail', id]` | `staleTime` 30s, atualizado direto pelo evento `nft.updated` |
| Sessão | `['session']` | `staleTime` infinito; muda só por login, logout ou expiração |
| Carrinho | `['private', userId, 'cart']` ou `['guest-cart']` | Substituído pela resposta das mutations; invalidado por eventos |
| Favoritos | `['private', userId, 'favorites']` | Atualização otimista com rollback |
| Pedido | `['private', userId, 'order', id]` | Consulta a cada 3s enquanto `pending`, como reserva caso o socket esteja caído |

- **Retries:** só para falhas passageiras (`NETWORK`, `UNAVAILABLE`, 5xx), no máximo 2. 4xx não é repetido. Mutations nunca são repetidas automaticamente
- **Respostas fora de ordem:** toda query passa o `signal` do TanStack Query ao Axios, então a requisição de um filtro antigo é cancelada quando o filtro muda. Como cada combinação de filtros tem a própria query key, uma resposta atrasada nunca sobrescreve outra
- **Atualização otimista:** favoritos mudam na hora (`onMutate`), voltam ao estado anterior se a API falhar (`onError`) e são confirmados com a API no fim (`onSettled`)

## Reconciliação entre REST e Socket.IO

- O socket avisa rápido; o REST é a fonte da verdade
- O cliente descarta eventos **duplicados** (ids já vistos) e **antigos** (versão menor ou igual à última aplicada, e também à versão que está no cache)
- `nft.updated` atualiza o detalhe no cache, invalida as listas e, se o NFT está no carrinho, invalida a cotação e anuncia a mudança em uma região `aria-live`
- `order.updated` invalida o pedido e o carrinho do dono e anuncia confirmação ou recusa
- A cada **reconexão**, o cliente invalida catálogo, carrinho e pedidos, buscando de novo pelo REST o que pode ter mudado enquanto a conexão estava caída. Depois de um refresh, a consulta ao pedido também resolve um pagamento pendente cujo prazo já passou

## Mocks, cenários e persistência

- O banco simulado (`src/mocks/db.ts`) nasce das fixtures e é salvo no `localStorage` (`kurio:mock-db:v1`). O reset restaura o cenário inicial
- Fixtures determinísticas: 36 NFTs (os 8 do Figma e 28 gerados sem `Math.random`), 2 usuários, carteiras e cupons
- Os cenários (`kurio:mock-scenario`) controlam latência, falhas, resultado do pagamento, recusa da carteira, timeout após criar o pedido e falha ao favoritar. Um handler `/api/*` que roda antes dos outros aplica atraso e falha em um único lugar
- Os mocks ficam ligados também no build de produção, para a demonstração. `VITE_ENABLE_MOCKS=false` desliga

## Testes

27 testes Playwright em Chromium, nos projetos desktop (1440×900) e mobile (Pixel 7, só os testes `@principal`), contra o build de produção. Cada teste parte de um navegador limpo. Os testes de tempo real passam pelo `socket.io-client` e os de REST pelos handlers do MSW. A regressão visual de início, detalhe, carrinho e pagamento tem baselines versionadas em `e2e/visual.spec.ts-snapshots`. Relatório HTML e traces de falhas ficam em `playwright-report/`.

## Decisões de UX

- **Login e cadastro em modal**, como no Figma: o usuário nunca perde a tela em que estava, inclusive quando a sessão expira no checkout
- **Checkout exige login**, mas o visitante monta o carrinho livremente
- **Conectar a carteira é um passo explícito**, para simular a permissão da extensão e o caso de recusa
- **Revisão antes do envio** em um diálogo com o total no botão ("Confirmar compra de X ETH")
- **Pedido pendente tem uma tela própria**, que pode ser recarregada sem risco
- **Ações fora do escopo** (Criadores, Aprenda, Esqueceu a senha, login social) aparecem desabilitadas e anunciadas como "em breve", sem aparentar sucesso

## Desvios do Figma e assets

- As artes dos NFTs não vieram separadas no arquivo. Foram recortadas da imagem exportada do Figma e convertidas para WebP. A galeria repete a mesma arte nas 4 miniaturas
- Fonte Roboto Mono via `@fontsource-variable/roboto-mono`, servida localmente
- Cores medidas na imagem exportada e aplicadas como tokens do shadcn (`--primary`, `--card` etc.)
- Pagamento: os campos "Nome do perfil", "Código de indicação", "Nome ENS" e "ENS ou carteira secundária" foram omitidos. A seleção usa as carteiras cadastradas do usuário
- Detalhe: a aba "Avaliações de colecionadores" e os botões de compartilhar não foram implementados
- Início: o "Diário da Cunhagem" e o rodapé completo foram simplificados
- Mobile: a navegação inferior com ícones do frame mobile não foi implementada; o cabeçalho é responsivo

### Ajustes de acessibilidade

- Os filtros parecem itens de lista, como no Figma, mas são checkboxes reais (escondidos visualmente) com foco visível
- Campos com só placeholder no Figma ganharam `<label>` para leitores de tela; erros são ligados ao campo por `aria-describedby` e o foco vai para o primeiro campo inválido
- Link "Pular para o conteúdo", foco devolvido ao botão que abriu o modal, estados que não dependem só de cor (edição esgotada também fica riscada e anunciada) e skeletons que respeitam `prefers-reduced-motion`

## Limitações e o que ficou fora

Com o prazo de dois dias, priorizei os fluxos de compra, conta, tempo real, mocks e testes, que concentram os critérios eliminatórios.

- **Perfil do colecionador** (edição de dados, avatar e senha) e **Carteiras** (cadastro e edição) não foram implementados. As carteiras existem nas fixtures e são usadas no checkout. Por isso o teste E2E nº 8 do enunciado não foi entregue
- A expiração da sessão é verificada nas chamadas autenticadas, não por um timer na interface
- O token no `localStorage` é aceitável para a simulação; em produção, um cookie `HttpOnly` seria mais seguro
- O SHA-256 simula o armazenamento sem senha em claro; um backend real usaria um hash lento com sal (bcrypt ou Argon2)
- O banco simulado vive no navegador: abas do mesmo navegador compartilham dados, navegadores diferentes não
- A exibição em ETH mostra até 4 casas decimais; as contas internas usam as 18

## Lighthouse

Auditoria de **início** e **detalhe do NFT**, nos perfis mobile e desktop, com o build de produção e o cenário padrão dos mocks (imagens, fontes, MSW e Socket.IO carregados, sem simplificações). São 3 medições por página e perfil, e a tabela mostra a mediana.

Como reproduzir: `npm run build && npm run lighthouse`. A configuração está em `lighthouse/run.mjs`; os relatórios HTML e JSON de cada medição, as versões e o ambiente ficam em `lighthouse/reports/` (`summary.json`).

| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Início | mobile | 94 | 100 | 100 | 100 | 3.1 s | 0 | 47 ms |
| Detalhe | mobile | 93 | 100 | 100 | 100 | 3.3 s | 0 | 43 ms |
| Início | desktop | 100 | 100 | 100 | 100 | 0.7 s | 0.002 | 0 ms |
| Detalhe | desktop | 100 | 100 | 100 | 100 | 0.8 s | 0.014 | 0 ms |

**Ambiente:** Lighthouse 13.6.0, Chrome 156 headless, Node 24.15, Windows 10 (build 26300), AMD Ryzen 5 5600, `vite preview` local. Perfil mobile com a emulação padrão do Lighthouse (4G lenta e CPU 4x mais lenta); desktop com a configuração `desktop-config` do Lighthouse.

**Ajustes feitos a partir da auditoria:**
- `scrollbar-gutter: stable` no `html`: a barra de rolagem que aparecia depois do carregamento deslocava o layout (CLS do detalhe caiu de 0.145 para 0.014)
- `robots.txt`, `meta description` e `lang="pt-BR"` para SEO
- Imagens em WebP com `width` e `height` explícitos, `fetchpriority="high"` na imagem principal e `loading="lazy"` nos cards abaixo da dobra

**Ponto de atenção:** o LCP no mobile, em torno de 3 s, fica acima do ideal (2.5 s). A tela só é desenhada depois de baixar e executar o React e o MSW (cerca de 350 kB comprimidos) e de registrar o Service Worker. O MSW faz parte da demonstração exigida; com um backend real, ele sai do build. Em uma máquina mais lenta, a performance mobile pode ficar abaixo de 90 pelo mesmo motivo.