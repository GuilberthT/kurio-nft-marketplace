# Kurio — Marketplace de NFTs

Desafio Frontend da Jungle Gaming: marketplace de NFTs com catálogo, detalhe, carrinho, pagamento, confirmação e conta, com API, sessão, carteiras e pagamentos **simulados**.

- **Demo:** https://kurio-nft-marketplace-ten.vercel.app/
- **Arquitetura e decisões:** [ARCHITECTURE.md](./ARCHITECTURE.md)

## Stack

React 19 · TypeScript (estrito) · TanStack Router · TanStack Query · Axios · Socket.IO (`socket.io-client`) · Tailwind CSS v4 · shadcn/ui (Radix) · MSW 2 + `@mswjs/socket.io-binding` · Playwright · Lighthouse · Vite

## Como rodar

Requer Node 20+.

```bash
npm install
npm run dev
```

Abra http://localhost:5173. Os mocks já vêm ligados: não é preciso criar `.env` nem subir backend.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Desenvolvimento com mocks |
| `npm run build` | Checagem de tipos + build de produção |
| `npm run preview` | Serve o build em http://localhost:4173 |
| `npm run typecheck` | Só a checagem de tipos |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Testes E2E e regressão visual (Playwright, desktop e mobile) |
| `npm run test:e2e:report` | Abre o relatório HTML dos testes |
| `npm run lighthouse` | Auditoria Lighthouse (ver ARCHITECTURE.md) |

Na primeira vez, instale o navegador dos testes com `npx playwright install chromium`.

## Variáveis de ambiente

Todas são opcionais. Veja `.env.example`.

| Variável | Padrão | Uso |
| --- | --- | --- |
| `VITE_ENABLE_MOCKS` | ligado | `false` desliga o MSW (para usar uma API real) |
| `VITE_API_URL` | `/api` | Base das chamadas REST |
| `VITE_REALTIME_URL` | `wss://realtime.kurio.test` | Servidor Socket.IO |

## Credenciais fictícias

| Usuário | E-mail | Senha | Carteiras |
| --- | --- | --- | --- |
| Ana | `ana@kurio.test` | `Kurio@123` | MetaMask (principal), Phantom (secundária) |
| Bruno | `bruno@kurio.test` | `Kurio@456` | Coinbase (principal) |

Cupons: `KURIO10` (10%), `GENESIS` (0.05 ETH) e `EXPIRADO` (vencido, para testar o erro).

## Cenários e reset

No canto inferior esquerdo, o botão **Cenários (mock)** abre um painel que controla a simulação. Os cenários ficam salvos no `localStorage` (`kurio:mock-scenario`), então valem também depois de um refresh.

- **Latência:** normal, lenta (+2.5s) ou variável (respostas fora de ordem)
- **Falha:** nenhuma, sem conexão ou erro 503
- **Pagamento:** aprovar ou recusar
- **Carteira recusa a conexão**
- **Timeout após criar o próximo pedido**
- **Favoritar falha** (testa o rollback da atualização otimista)
- **Ações de tempo real:** mudar preço, esgotar edição, reenviar evento duplicado, enviar evento antigo e derrubar a conexão
- **Expirar a sessão**
- **Resetar todos os dados:** restaura o cenário inicial (fixtures, usuários, carrinhos, pedidos)

## Como reproduzir os fluxos de falha

| Fluxo | Passos |
| --- | --- |
| Preço muda no carrinho | Entre como Ana, coloque o Emerald Ape #042 no carrinho e clique em "passa a custar 1.49 ETH" no painel |
| Checkout com cotação desatualizada | Abra a revisão do pedido e clique em "Esgotar a edição 1/10" ou mude o preço |
| Evento duplicado ou antigo | Mude o preço e depois use "Reenviar o último evento" e "Enviar evento antigo": o preço não regride |
| Pagamento recusado | Pagamento = recusar, depois finalize a compra: o carrinho é preservado |
| Timeout com recuperação | Marque "Timeout após criar o próximo pedido", confirme, e confirme de novo: o mesmo pedido é recuperado |
| Clique duplo | Clique duas vezes em "Confirmar compra": só um pedido é criado |
| Queda de conexão com pedido pendente | Confirme a compra e, em "Aguardando confirmação", clique em "Derrubar a conexão" ou recarregue a página |
| Sessão expirada no checkout | No pagamento, clique em "Expirar a sessão" e faça uma ação: o login abre e o formulário é mantido |
| Carregamento lento e erro | Latência lenta + Falha 503, recarregue: skeletons, erro e "Tentar novamente" |
| Favorito com rollback | Marque "Favoritar falha" e clique em Favoritar |
| Cadastro com conflito | Crie conta com `ana@kurio.test` |

## Uso de IA

Usei o Claude como ferramenta de apoio durante todo o desenvolvimento, para tirar dúvidas, gerar código e revisar erros. Fui responsável por integrar cada parte, depurar os problemas de tipagem, importação e lint, e testar todos os cenários pelo painel de cenários. Os testes E2E encontraram dois bugs de acessibilidade (o foco ao fechar o modal e o foco no primeiro campo com erro), que foram corrigidos.

No caminho aprendi conceitos novos para mim, como idempotência de pedidos, atualização otimista com rollback, valores monetários com bigint e reconciliação entre Socket.IO e REST.