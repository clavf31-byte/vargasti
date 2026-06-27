# Padronização Visual VargasTI

Objetivo: unificar 100% do visual do sistema usando tokens semânticos, componentes reutilizáveis e o padrão graphite + verde marca + ciano de seleção já iniciado no dashboard e na tela "Seus agentes".

Escopo visual apenas: nenhuma rota, endpoint, server function, schema de banco ou regra de negócio será alterada.

## Decisão de direção visual

- Cor primária da marca: **verde** (`--brand`) — botões principais, sidebar ativa, logo, status positivos.
- Cor de seleção/foco/accent: **azul/ciano** (`--select`) — borda e glow em cards selecionáveis, focus ring, badges de atenção, tabs ativas.
- Fundo: graphite escuro (`--background`, `--surface`, `--surface-2`) com grid sutil e glows ciano/esmeralda já existentes.
- Tipografia: Inter + JetBrains Mono, escala 14px base, títulos grandes e tracking ajustado.
- Cards: bordas suaves, radius de 14–16px, sombras sutis, estados hover/transição padronizados.

## Estado atual observado

- Tokens CSS já existem em `src/styles.css` e estão razoáveis.
- `src/components/shared.tsx` já contém vários componentes modernos: `PageHeader`, `SectionHeader`, `IconBox`, `StatCard`, `EmptyState`, `LoadingState`, `Toolbar`, `Btn`, `FieldInput`, `DataCard`, `ModernCard`, `SelectableCard`, `FormModal`, `StatusBadge`.
- `src/components/ui/index.ts` ainda exporta componentes antigos baseados em `src/lib/colors.ts` (`AppCard`, `AppButton`, `StatCard`, `PageHeader`) que conflitam com os novos.
- `src/lib/colors.ts` ainda é usado em várias rotas, especialmente CRM, forçando cores hardcoded e estilos inline.
- `AppShell` tem estilos inline com hexadecimais e ainda não usa os tokens totalmente.
- Dashboard e WhatsApp já seguem bem o padrão; Anotações e CRM precisam de mais trabalho.

## Onda 1 — Fundação (tokens e componentes base)

1. **Limpar componentes antigos**
   - Remover ou descontinuar `src/components/ui/AppCard.tsx`, `src/components/ui/AppButton.tsx`, `src/components/ui/StatCard.tsx`, `src/components/ui/PageHeader.tsx`.
   - Atualizar `src/components/ui/index.ts` para re-exportar os componentes modernos de `src/components/shared.tsx` (mantendo compatibilidade de import para rotas que usam `@/components/ui`).
   - Marcar `src/lib/colors.ts` como legado e criar função de migração documentada.

2. **Ajustar `src/styles.css`**
   - Garantir que todos os tokens usados nos componentes existam (`--background`, `--foreground`, `--card`, `--surface`, `--surface-2`, `--brand`, `--brand-muted`, `--brand-foreground`, `--select`, `--select-foreground`, `--destructive`, `--warning`, `--info`, `--border`, `--input`, `--ring`, `--shadow-card`, `--shadow-card-hover`, `--shadow-select`).
   - Adicionar utilidades faltantes: `card-hover`, `btn-select`, `btn-ghost`, `text-balance`, `animate-fade-in-stagger`.
   - Verificar contraste e dark mode.

3. **Alinhar componentes shadcn com o design system**
   - `button.tsx`: adicionar variants `brand` (verde), `select` (ciano), `ghost-dark` (fundo escuro com borda).
   - `card.tsx`: usar `card-graphite` utility e ajustar radius/padding.
   - `input.tsx`, `textarea.tsx`, `select.tsx`: usar `input-base` utility com focus ciano.
   - `table.tsx`: header escuro, linhas espaçadas, hover sutil, badges.
   - `dialog.tsx`: overlay escuro, card grafite, animação fade-in.
   - `sonner.tsx`: tema escuro grafite + borda suave.

4. **Refinar `AppShell`**
   - Substituir hexadecimais inline por tokens semânticos onde possível sem perder a identidade visual atual.
   - Garantir que o header, sidebar e breadcrumb usem as mesmas cores/focus/selected states do restante do sistema.
   - Manter respiro interno: `max-w-7xl mx-auto px-6 py-8` para conteúdo principal.

## Onda 2 — Componentes globais (ui-kit)

1. **Consolidar `src/components/shared.tsx`**
   - Manter todos os componentes já criados e garantir que usem apenas tokens do Tailwind (`bg-surface`, `border-border`, `text-brand`, `text-select`, etc.).
   - Corrigir inconsistências menores: `StatusBadge` receber mapas padrão para status comuns (`rascunho`, `enviado`, `aprovado`, `rejeitado`, `pendente`, `atrasado`, `concluído`, `conectado`, `desconectado`).
   - Adicionar `SkeletonCard` e `SkeletonTableRow` para loading states consistentes.

2. **Criar `src/components/ui-kit/` (organização opcional)**
   - Mover/duplicar os componentes mais genéricos para `src/components/ui-kit/` e deixar `src/components/shared.tsx` como re-exportador para compatibilidade.
   - Criar `ActionCard`, `MetricCard`, `ModernButton`, `ModernInput`, `ModernSelect`, `ModernTextarea`, `ModernModal`, `ModernTable` como wrappers/variants sobre shadcn + tokens.

## Onda 3 — Páginas de listagem e dashboard

1. **`src/routes/dashboard.tsx`**
   - Já está bem alinhado; normalizar para usar `MetricCard`/`ActionCard` consolidados.
   - Remover hexadecimais inline (`#4ade80`, `#60a5fa`, etc.) e usar tokens (`text-brand`, `text-select`, `text-warning`, `text-destructive`, etc.).
   - Padronizar headings e spacing.

2. **`src/routes/projetos.tsx`**
   - Substituir cards inline por `ModernCard`/`SelectableCard`.
   - Usar `StatusBadge` com mapas padrão.
   - Usar `Toolbar`, `Btn`, `FieldInput`, `FormModal`.
   - Adicionar `EmptyState` e `LoadingState`.

3. **`src/routes/arquivos.tsx`**
   - Converter tabela inline para `ModernTable`.
   - Padronizar stats com `StatCard`.
   - Usar `EmptyState` e `LoadingState`.

4. **`src/routes/ferramentas.index.tsx`**
   - Substituir cards por `ActionCard` com `IconBox`.
   - Padronizar badge/variante de disponibilidade.
   - Ajustar hover/focus para borda ciano.

5. **`src/routes/anotacoes.tsx`**
   - Refatorar a sidebar, editor e lista para usar os tokens e componentes modernos.
   - Substituir estilos inline por `card-graphite`, `btn-modern`, `input-base`.
   - Adicionar `EmptyState` e `LoadingState`.
   - Padronizar modais de proteção com `FormModal`.

6. **`src/routes/admin.tsx` + `src/routes/admin.index.tsx` + `src/routes/admin.$operatorId.tsx` + `src/routes/usuarios.tsx` (se existir)**
   - Aplicar `PageHeader`, `DataCard`, `ModernTable`, `StatusBadge`, `Btn`, `Toolbar`.
   - Garantir que permissões e roles usem badges padrão.

## Onda 4 — Páginas de detalhe, edição e ferramentas especializadas

1. **`src/components/whatsapp/WhatsappAgent.tsx` + `src/routes/ferramentas.whatsapp.tsx`**
   - Já é a referência; manter e ajustar pequenas inconsistências (tabs, alerts, inputs).
   - Garantir que todos os botões usem `Btn` ou shadcn variants, não estilos inline.

2. **`src/routes/ferramentas.excel.tsx` + `src/components/excel/*`**
   - Refatorar toolbars, tabela, modais e cards para usar tokens.
   - Substituir `ExcelTable` inline por `ModernTable`.
   - Padronizar input/select/textarea.

3. **`src/routes/ferramentas.emails.tsx` + `src/components/EmailConfigInline.tsx` + `src/components/EmailPollingWidget.tsx`**
   - Aplicar `DataCard`, `SectionHeader`, `Btn`, `StatusBadge`, `ModernInput`.
   - Padronizar estados de conexão (Conectado/Desconectado/Aguardando).

4. **`src/routes/config.index.tsx` + `src/routes/config.permissions.tsx`**
   - Refatorar para `ModernCard`, `FormModal`, `ModernTable`, `Btn`, `FieldInput`, `Switch` shadcn.
   - Padronizar permissões com cards selecionáveis.

5. **Rotas de CRM (`src/routes/crm.*`)**
   - Substituir todos os imports de `@/lib/colors` por tokens Tailwind.
   - Substituir `colors`, `spacing`, `borderRadius` inline por classes utilitárias (`bg-surface`, `border-border`, `p-6`, `rounded-xl`, etc.).
   - Usar `PageHeader`, `DataCard`, `ModernTable`, `Btn`, `StatusBadge`, `FormModal`, `EmptyState`, `LoadingState`.
   - Priorizar `crm.orcamentos.index.tsx`, `crm.clientes.index.tsx`, `crm.clientes.$id.tsx`, `crm.orcamentos.$id.tsx`, `crm.orcamentos.editar.$id.tsx` (já citadas em build errors recentes).

## Onda 5 — Login, landing e estados globais

1. **`src/routes/login.tsx`**
   - Já está moderno; trocar hexadecimais restantes por tokens (`bg-surface`, `border-border`, `text-brand`, `text-select`, etc.).
   - Garantir que inputs e botões usem as variants shadcn/ui-kit.

2. **`src/routes/index.tsx` (landing page)**
   - Manter identidade visual; ajustar seções para usar tokens onde houver hexadecimais inline.
   - Garantir responsividade e contraste.

3. **Estados globais**
   - `sonner.tsx`: tema escuro grafite.
   - `EmptyState` em todas as listas vazias.
   - `LoadingState` com skeletons consistentes.
   - Verificar se todos os `Error`/`404` boundaries usam o mesmo visual.

## Garantias

- Nenhuma rota será removida ou renomeada.
- Nenhum endpoint, server function ou schema de banco será alterado.
- `AuthContext`, supabase client, server functions, migrations, RLS e edge functions permanecem intactos.
- Apenas JSX, CSS, className e variants de componentes serão alterados.
- Zero cores hardcoded (`text-white`, `bg-black`, `bg-[#...]`) em componentes — todas via tokens semânticos.

## Técnico

- Tailwind v4 com `@theme inline` em `src/styles.css`.
- Componentes em `src/components/shared.tsx` (compat) e `src/components/ui-kit/` (nova organização).
- shadcn components estendidos via variants, não duplicados.
- Animações via `tw-animate-css` e utilidades existentes (`animate-fade-in`).

## Execução

Aplicar em 5 ondas sequenciais. Entre cada onda, o build será verificado para evitar regressões. O usuário pode pausar/revisar após qualquer onda.