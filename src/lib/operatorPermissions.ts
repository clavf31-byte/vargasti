export type OperatorRole = "admin" | "gestor" | "administrativo" | "tecnico" | "operador" | "cliente";
export type OperatorStatus = "pending" | "approved" | "rejected";

export const OPERATOR_ROLES: { value: OperatorRole; label: string; cls: string }[] = [
  { value: "admin", label: "Administrador", cls: "text-brand bg-brand/10 border-brand/20" },
  { value: "gestor", label: "Gestor", cls: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  { value: "administrativo", label: "Administrativo", cls: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
  { value: "tecnico", label: "Técnico", cls: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  { value: "operador", label: "Operador", cls: "text-muted-foreground bg-surface-2 border-border" },
  { value: "cliente", label: "Cliente", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
];

export type PermissionGroup = {
  module: string;
  label: string;
  perms: { key: string; label: string }[];
};

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    module: "dashboard",
    label: "Dashboard",
    perms: [
      { key: "view", label: "Visualizar dashboard" },
      { key: "view_financial", label: "Ver indicadores financeiros" },
      { key: "view_technical", label: "Ver indicadores técnicos" },
    ],
  },
  {
    module: "crm",
    label: "CRM",
    perms: [
      { key: "view", label: "Visualizar clientes" },
      { key: "create", label: "Criar clientes" },
      { key: "edit", label: "Editar clientes" },
      { key: "delete", label: "Excluir clientes" },
      { key: "view_history", label: "Ver histórico" },
    ],
  },
  {
    module: "orcamentos",
    label: "Orçamentos",
    perms: [
      { key: "view", label: "Visualizar orçamentos" },
      { key: "create", label: "Criar" },
      { key: "edit", label: "Editar" },
      { key: "delete", label: "Excluir" },
      { key: "approve", label: "Aprovar" },
      { key: "cancel", label: "Cancelar" },
      { key: "send_email", label: "Enviar por e-mail" },
      { key: "pdf", label: "Gerar PDF" },
      { key: "view_values", label: "Ver valores" },
      { key: "discount", label: "Aplicar desconto" },
    ],
  },
  {
    module: "os",
    label: "Chamados / OS",
    perms: [
      { key: "view", label: "Visualizar chamados" },
      { key: "view_all", label: "Ver chamados de todos" },
      { key: "view_own", label: "Ver apenas os próprios" },
      { key: "create", label: "Criar chamado" },
      { key: "edit", label: "Editar chamado" },
      { key: "assign", label: "Assumir chamado" },
      { key: "complete", label: "Concluir chamado" },
      { key: "cancel", label: "Cancelar chamado" },
      { key: "reopen", label: "Reabrir chamado" },
      { key: "delete", label: "Excluir chamado" },
    ],
  },
  {
    module: "agenda",
    label: "Agenda",
    perms: [
      { key: "view", label: "Visualizar agenda" },
      { key: "view_all", label: "Ver agenda de todos" },
      { key: "create", label: "Criar agendamento" },
      { key: "edit", label: "Editar agendamento" },
      { key: "delete", label: "Excluir agendamento" },
    ],
  },
  {
    module: "assets",
    label: "Ativos",
    perms: [
      { key: "view", label: "Visualizar ativos" },
      { key: "create", label: "Criar ativos" },
      { key: "edit", label: "Editar ativos" },
      { key: "delete", label: "Excluir ativos" },
      { key: "move", label: "Movimentar ativos" },
      { key: "approve_request", label: "Aprovar solicitação" },
      { key: "view_stock", label: "Ver estoque" },
    ],
  },
  {
    module: "kb",
    label: "Base de Conhecimento",
    perms: [
      { key: "view", label: "Visualizar artigos" },
      { key: "create", label: "Criar artigos" },
      { key: "edit", label: "Editar artigos" },
      { key: "publish", label: "Publicar artigos" },
      { key: "delete", label: "Excluir artigos" },
    ],
  },
  {
    module: "reports",
    label: "Relatórios",
    perms: [
      { key: "view", label: "Visualizar relatórios" },
      { key: "export", label: "Exportar" },
      { key: "view_financial", label: "Ver financeiros" },
      { key: "view_technical", label: "Ver técnicos" },
    ],
  },
  {
    module: "admin",
    label: "Administração",
    perms: [
      { key: "view_operators", label: "Ver operadores" },
      { key: "create_operators", label: "Criar operadores" },
      { key: "edit_operators", label: "Editar operadores" },
      { key: "delete_operators", label: "Excluir operadores" },
      { key: "approve_access", label: "Aprovar acessos" },
      { key: "edit_permissions", label: "Alterar permissões" },
      { key: "view_logs", label: "Ver logs" },
      { key: "settings", label: "Configurações do sistema" },
    ],
  },
];

const ALL_TRUE = PERMISSION_GROUPS.reduce<Record<string, boolean>>((acc, g) => {
  g.perms.forEach((p) => { acc[`${g.module}.${p.key}`] = true; });
  return acc;
}, {});

export const ROLE_DEFAULT_PERMISSIONS: Record<OperatorRole, Record<string, boolean>> = {
  admin: ALL_TRUE,
  gestor: {
    "dashboard.view": true, "dashboard.view_financial": true, "dashboard.view_technical": true,
    "crm.view": true, "crm.create": true, "crm.edit": true, "crm.view_history": true,
    "orcamentos.view": true, "orcamentos.create": true, "orcamentos.edit": true,
    "orcamentos.approve": true, "orcamentos.cancel": true, "orcamentos.send_email": true,
    "orcamentos.pdf": true, "orcamentos.view_values": true,
    "os.view": true, "os.view_all": true, "os.create": true, "os.edit": true,
    "os.assign": true, "os.complete": true, "os.cancel": true,
    "agenda.view": true, "agenda.view_all": true, "agenda.create": true, "agenda.edit": true,
    "assets.view": true, "assets.view_stock": true, "assets.approve_request": true,
    "kb.view": true,
    "reports.view": true, "reports.export": true, "reports.view_financial": true, "reports.view_technical": true,
    "admin.view_operators": true, "admin.approve_access": true,
  },
  administrativo: {
    "dashboard.view": true,
    "crm.view": true, "crm.create": true, "crm.edit": true,
    "orcamentos.view": true, "orcamentos.create": true, "orcamentos.edit": true,
    "orcamentos.send_email": true, "orcamentos.pdf": true, "orcamentos.view_values": true,
    "kb.view": true,
    "reports.view": true,
  },
  tecnico: {
    "dashboard.view": true, "dashboard.view_technical": true,
    "crm.view": true,
    "os.view": true, "os.view_own": true, "os.create": true, "os.assign": true, "os.complete": true,
    "agenda.view": true, "agenda.create": true, "agenda.edit": true,
    "assets.view": true, "assets.move": true,
    "kb.view": true,
  },
  operador: {
    "dashboard.view": true,
    "crm.view": true,
    "os.view": true, "os.view_own": true, "os.create": true,
    "agenda.view": true,
    "kb.view": true,
  },
  cliente: {
    "dashboard.view": true,
    "os.view": true, "os.view_own": true, "os.create": true,
    "kb.view": true,
  },
};

export function normalizeRole(raw: string | undefined | null): OperatorRole {
  const valid: OperatorRole[] = ["admin", "gestor", "administrativo", "tecnico", "operador", "cliente"];
  if (raw && valid.includes(raw as OperatorRole)) return raw as OperatorRole;
  return "operador";
}

export function normalizeStatus(raw: string | undefined | null): OperatorStatus {
  if (raw === "pending" || raw === "rejected") return raw;
  if (raw === "active") return "approved";
  if (raw === "approved") return "approved";
  return "pending";
}

export function roleConfig(role: OperatorRole) {
  return OPERATOR_ROLES.find((r) => r.value === role) ?? OPERATOR_ROLES[4];
}
