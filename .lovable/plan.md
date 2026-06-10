# Padronização Visual VargasTI

Vou unificar o visual do sistema inteiro usando como referência o Dashboard atual + a tela "Seus agentes". O foco é **somente visual** — funcionalidades, rotas, dados e regras de negócio permanecem intactos.

## Decisão de cor de destaque

A referência mostra borda **azul/ciano** no card selecionado, mas o sistema hoje usa **verde (brand)** como cor primária (logo VargasTI, status pulse, sidebar). Proponho:

- **Manter verde** como cor primária da marca (botões primários, sidebar ativa, logo).
- **Adicionar azul/ciano** como cor de *seleção* (borda + glow em cards selecionáveis, foco, accent), exatamente como no print.

Isso preserva a identidade VargasTI e aplica fielmente o padrão do print.

## Etapa 1 — Design tokens (`src/styles.css`)

- Novos tokens: `--accent-select` (azul/ciano), `--card-graphite`, `--card-graphite-2`, `--border-soft`, `--ring-select`, `--shadow-card`, `--shadow-card-hover`.
- Utilities novas: `.card-graphite`, `.card-selectable`, `.card-selected`, `.icon-box`, `.divider-soft`.
- Padronizar raios (`--radius` para 14–16px), padding generoso, scrollbar já está ok.

## Etapa 2 — Componentes globais (`src/components/ui-kit/`)

Criar/refatorar componentes reutilizáveis (sem quebrar shadcn existente):

- `PageHeader` (já existe — incrementar com tamanhos do print).
- `SectionHeader` — eyebrow + título grande + subtítulo.
- `ModernCard` — base grafite + borda suave + radius grande + padding.
- `SelectableCard` — variante com estado `selected` (borda azul/ciano + glow).
- `MetricCard` — KPI estilo dashboard (refatorar `KpiCard`).
- `ActionCard` — card com header (IconBox + título/subtítulo) + corpo + divisor + rodapé de ações (padrão do print).
- `IconBox` — bloco quadrado arredondado com ícone grande.
- `StatusBadge` — ponto colorido + texto (Conectado/Desconectado/Aguardando).
- `EmptyState` — IconBox grande + título + subtítulo + CTA opcional (padrão "Criar novo agente" tracejado).
- `LoadingState` — skeletons no mesmo tom dos cards.
- `ModernButton` — variantes (`primary` verde, `select` azul, `ghost` escuro com borda, `destructive`, `secondary`). Implementado como variants no `button.tsx` existente.
- `ModernInput`, `ModernTextarea`, `ModernSelect` — estilos consistentes (fundo escuro, borda suave, focus azul) aplicados aos componentes shadcn existentes (`input.tsx`, `textarea.tsx`, `select.tsx`).
- `ModernModal` — overlay escuro + card grafite + animação (ajuste no `dialog.tsx`).
- `ModernTable` — header escuro, linhas espaçadas, hover, badges (ajuste no `table.tsx`).

Estratégia: **estender os componentes shadcn existentes** ao invés de duplicar, para não quebrar imports.

## Etapa 3 — AppLayout

`AppShell` já está bom; pequenos ajustes:
- Header da página interna usando `PageHeader` padronizado.
- Garantir respiro (container `max-w-7xl mx-auto px-6 py-8`).

## Etapa 4 — Aplicação por página

Refatorar cada rota usando os componentes globais, **sem mexer em lógica**:

1. `routes/index.tsx` (Dashboard) — já é referência; normalizar para usar `MetricCard`/`ActionCard`.
2. `routes/anotacoes.tsx`
3. `routes/ferramentas.index.tsx` (Tools)
4. `routes/ferramentas.excel.tsx` + `components/excel/*` (toolbars, tabela, modais)
5. `routes/projetos.tsx`
6. `routes/arquivos.tsx`
7. `routes/config.tsx`
8. `routes/admin.tsx` + `routes/usuarios.tsx` (Usuários)
9. `routes/ferramentas.whatsapp.tsx` + `components/whatsapp/WhatsappAgent.tsx` (já é a referência — garantir consistência)
10. `routes/login.tsx` — card grafite centralizado, mesmo estilo

## Etapa 5 — Estados globais

- Toasts (`sonner.tsx`) — tema escuro grafite + borda suave.
- Empty states em todas as listas.
- Loading states com skeletons consistentes.

## Garantias

- Nenhuma rota removida ou renomeada.
- Nenhum endpoint, server function ou schema alterado.
- `AuthContext`, supabase client, server functions: intactos.
- Migrations, RLS, edge functions: intactos.
- Apenas JSX/CSS/className/variants alterados.

## Detalhes técnicos

- Tudo em Tailwind v4 + tokens semânticos em `src/styles.css`. Zero cor hardcoded (`bg-[#...]`, `text-white`).
- Componentes em `src/components/ui-kit/` para clareza, re-exportando/estendendo shadcn.
- Animações via `tw-animate-css` já instalado + utility `animate-fade-in` existente.

## Escopo de risco

Refatoração visual ampla — 10+ rotas e 30+ componentes. Vou aplicar em ondas:
1. Tokens + ui-kit (base).
2. Páginas de listagem (Anotações, Projetos, Arquivos, Tools, Usuários).
3. Páginas de detalhe/edição (Excel, WhatsApp, Config).
4. Login + estados auxiliares.

Posso pausar entre ondas se você quiser revisar progresso, ou ir direto até o fim. Confirma para eu começar?
