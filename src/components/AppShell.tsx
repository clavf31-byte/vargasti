import { Link, useRouterState, Outlet } from "@tanstack/react-router";
import {
  LayoutDashboard, Mail, FileSpreadsheet, NotebookPen, FolderKanban,
  Files, Settings, User, LogOut, Menu, X, Search, ShieldCheck, ChevronDown, MessageCircle, Wrench, Users, ScrollText, ClipboardList,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import vargasLogo from "@/assets/vargasti-icon.png";
import { useAuth } from "@/contexts/AuthContext";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { CommandPalette } from "@/components/CommandPalette";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import type { ModulePermissions } from "@/hooks/useModulePermissions";

const NAV_MODULES = [
  {
    group: "Ferramentas",
    groupIcon: Wrench,
    items: [
      { to: "/ferramentas/emails", label: "Email Agent", icon: Mail, permKey: "can_access_email" as keyof ModulePermissions },
      { to: "/ferramentas/excel", label: "Excel Tool", icon: FileSpreadsheet, permKey: "can_access_excel" as keyof ModulePermissions },
      { to: "/ferramentas/whatsapp", label: "WhatsApp", icon: MessageCircle },
    ],
  },
  {
    group: "Projetos & Notas",
    groupIcon: FolderKanban,
    items: [
      { to: "/projetos", label: "Projetos", icon: FolderKanban, permKey: "can_access_projects" as keyof ModulePermissions },
      { to: "/anotacoes", label: "Anotações", icon: NotebookPen, permKey: "can_access_notes" as keyof ModulePermissions },
    ],
  },
  {
    group: "CRM",
    groupIcon: Users,
    items: [
      { to: "/crm/clientes", label: "Clientes", icon: Users, permKey: "can_access_crm" as keyof ModulePermissions },
      { to: "/crm/orcamentos", label: "Orçamentos", icon: FileSpreadsheet, permKey: "can_access_crm" as keyof ModulePermissions },
      { to: "/crm/contratos", label: "Contratos", icon: ScrollText, permKey: "can_access_crm" as keyof ModulePermissions },
      { to: "/crm/contratos/modelos", label: "Modelos", icon: ClipboardList, permKey: "can_access_crm" as keyof ModulePermissions },
      { to: "/crm/pagamentos", label: "Pagamentos", icon: Mail, permKey: "can_access_crm" as keyof ModulePermissions },
    ],
  },
  {
    group: "Storage",
    groupIcon: Files,
    items: [
      { to: "/arquivos", label: "Arquivos", icon: Files, permKey: "can_access_files" as keyof ModulePermissions },
    ],
  },
];

const NAV_ADMIN = [
  {
    group: "Admin",
    groupIcon: ShieldCheck,
    items: [
      { to: "/admin", label: "Operadores", icon: ShieldCheck },
      { to: "/config", label: "Configurações", icon: Settings },
    ],
  },
];

export function AppShell({ children }: { children?: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const { open: commandPaletteOpen, setOpen: setCommandPaletteOpen } = useCommandPalette();
  const { perms, isAdmin, loaded: permsLoaded } = useModulePermissions();

  const displayName =
    user?.user_metadata?.full_name?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "user";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  const ALL_MODULES = isAdmin ? [...NAV_MODULES, ...NAV_ADMIN] : NAV_MODULES;

  const VISIBLE_MODULES = permsLoaded && !isAdmin
    ? ALL_MODULES.map(group => ({
        ...group,
        items: group.items.filter(item =>
          !(item as { permKey?: keyof ModulePermissions }).permKey ||
          perms[(item as { permKey?: keyof ModulePermissions }).permKey!] !== false
        ),
      })).filter(group => group.items.length > 0)
    : ALL_MODULES;

  const ROUTE_LABELS: Record<string, string> = {
    dashboard: "Dashboard",
    ferramentas: "Ferramentas",
    emails: "Email Agent",
    excel: "Excel Tool",
    whatsapp: "WhatsApp",
    projetos: "Projetos",
    anotacoes: "Anotações",
    arquivos: "Arquivos",
    crm: "CRM",
    clientes: "Clientes",
    orcamentos: "Orçamentos",
    contratos: "Contratos",
    modelos: "Modelos",
    pagamentos: "Pagamentos",
    pipeline: "Pipeline",
    pecas: "Peças",
    servicos: "Serviços",
    tarefas: "Tarefas",
    config: "Config",
    permissions: "Permissões",
    index: "",
    admin: "Admin",
    setup: "Setup",
    novo: "Novo",
    editar: "Editar",
  };

  const breadcrumbs = pathname
    .split("/")
    .filter(Boolean)
    .map((seg) => ROUTE_LABELS[seg] ?? seg)
    .filter(Boolean);

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const isItemActive = (to: string) => to === "/" ? pathname === "/dashboard" : pathname.startsWith(to);

  return (
    <div className="min-h-screen flex" style={{
      background: `
        linear-gradient(rgba(0,213,230,.045) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,213,230,.045) 1px, transparent 1px),
        radial-gradient(circle at top right, rgba(0, 213, 230, .16), transparent 35%),
        #07111c
      `,
      backgroundSize: "42px 42px, 42px 42px, 100% 100%",
    }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[292px] flex flex-col shrink-0
          border-r transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{
          background: "linear-gradient(180deg, #062235 0%, #061827 45%, #04111d 100%)",
          borderColor: "rgba(0, 213, 230, .16)",
          boxShadow: "16px 0 50px rgba(0,0,0,.32)",
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-3.5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,.07)" }}>
          <Link
            to="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center flex-1" style={{ gap: 0 }}
          >
            <img
              src={vargasLogo}
              alt="VargasTI"
              style={{
                width: 120,
                height: 120,
                objectFit: "contain",
                flexShrink: 0,
                marginRight: -14,
                filter: "invert(1) hue-rotate(180deg) drop-shadow(0 0 10px rgba(19,200,211,0.6))",
                mixBlendMode: "screen",
              }}
            />
            <div className="min-w-0">
              <h1 className="font-bold leading-tight" style={{ fontSize: 26 }}>
                <span style={{ color: "#eaf3f8" }}>Vargas</span><span style={{ color: "#13c8d3" }}>TI</span>
              </h1>
              <span className="text-[10px] font-medium tracking-wide" style={{ color: "rgba(19,200,211,0.7)" }}>
                Soluções que conectam
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-[#8da2b4] hover:text-[#eaf3f8] transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Dashboard link */}
        <Link
          to="/dashboard"
          onClick={() => setSidebarOpen(false)}
          className={`mx-3.5 mt-3 px-3 py-3 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
            pathname === "/dashboard"
              ? "text-[#eaf3f8]"
              : "text-[#d7e4ec] hover:text-[#eaf3f8]"
          }`}
          style={{
            background: pathname === "/dashboard"
              ? "linear-gradient(135deg, #087f97, #0fb7c7)"
              : "rgba(255,255,255,.035)",
            border: pathname === "/dashboard"
              ? "none"
              : "1px solid rgba(255,255,255,.055)",
            boxShadow: pathname === "/dashboard"
              ? "0 10px 24px rgba(0,0,0,.22)"
              : "none",
          }}
        >
          <LayoutDashboard className="size-4" />
          Dashboard
        </Link>

        {/* Navigation */}
        <nav className="flex-1 px-3.5 py-4 space-y-3 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#6f879c]">
            Módulos
          </p>

          {VISIBLE_MODULES.map(({ group, groupIcon: GroupIcon, items }) => (
            <div key={group} className="rounded-[13px] overflow-hidden">
              <button
                onClick={() => toggleGroup(group)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-[#eaf3f8] font-bold rounded-lg transition-colors"
                style={{
                  background: expandedGroups[group] ? "rgba(19,200,211,.1)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!expandedGroups[group]) {
                    e.currentTarget.style.background = "rgba(19,200,211,.06)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!expandedGroups[group]) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <span className="flex items-center gap-2 text-sm font-bold">
                  <GroupIcon className="size-4 opacity-70" />
                  {group}
                </span>
                <ChevronDown
                  className="size-3.5 transition-transform"
                  style={{
                    transform: expandedGroups[group] ? "rotate(0deg)" : "rotate(-90deg)",
                  }}
                />
              </button>

              {expandedGroups[group] && (
                <div
                  className="ml-4.5 pl-3.5 flex flex-col gap-1 py-2 border-l"
                  style={{ borderColor: "rgba(19,200,211,.26)" }}
                >
                  {items.map(({ to, label, icon: Icon }) => {
                    const active = isItemActive(to);
                    return (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          flex items-center gap-2 px-2.5 py-2 rounded-[10px] text-sm
                          transition-all ${
                            active
                              ? "text-white"
                              : "text-[#d7e4ec] hover:text-white"
                          }
                        `}
                        style={{
                          background: active
                            ? "rgba(19,200,211,.16)"
                            : "transparent",
                          boxShadow: active
                            ? "inset 3px 0 0 #13c8d3"
                            : "none",
                        }}
                      >
                        <Icon className="size-4" />
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Shortcuts */}
        <div className="border-t" style={{ borderColor: "rgba(255,255,255,.08)" }}>
          <p className="px-4 pt-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#6f879c]">
            Atalhos
          </p>
          <div className="px-3.5 pb-3 space-y-2">
            <div
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg text-[#8da2b4] text-sm cursor-pointer transition-all"
              style={{ background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.07)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,.06)";
                e.currentTarget.style.borderColor = "rgba(19,200,211,.24)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,.045)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,.07)";
              }}
            >
              <span className="flex items-center gap-2"><Search className="size-3.5" /> Busca rápida</span>
              <span className="text-[9px] px-1.5 py-0.5 border rounded" style={{ borderColor: "rgba(255,255,255,.14)", background: "rgba(255,255,255,.06)" }}>
                CTRL K
              </span>
            </div>
          </div>
        </div>

      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className="h-12 border-b flex items-center gap-3 px-4 sticky top-0 z-30 shrink-0 backdrop-blur-md"
          style={{ borderColor: "rgba(0, 213, 230, .16)", background: "rgba(6, 24, 39, 0.8)" }}
        >
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-[#8da2b4] hover:text-[#eaf3f8] transition-colors"
          >
            <Menu className="size-4" />
          </button>

          {/* Breadcrumb (desktop) */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-[10px] text-[#8da2b4] uppercase tracking-widest">VargasTI</span>
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="text-[#8da2b4]/30">/</span>
                <span className={`text-[10px] font-medium ${i === breadcrumbs.length - 1 ? "text-[#eaf3f8]" : "text-[#8da2b4]"}`}>
                  {crumb}
                </span>
              </span>
            ))}
          </div>

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              title="Busca global (CTRL K)"
              className="p-2 rounded-lg text-[#8da2b4] hover:text-[#eaf3f8] transition-colors"
            >
              <Search className="size-3.5" />
            </button>

            <div className="h-4 w-px" style={{ background: "rgba(0, 213, 230, .16)" }} />

            <div className="flex items-center gap-1.5">
              <span className="size-1.5 bg-[#13c8d3] rounded-full" style={{ animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
              <span className="text-[10px] text-[#8da2b4] hidden sm:block">online</span>
            </div>

            <div className="h-4 w-px" style={{ background: "rgba(0, 213, 230, .16)" }} />

            <div className="flex items-center gap-2 group cursor-pointer" onClick={signOut} title="Sair">
              <div
                className="w-7 h-7 rounded-full grid place-items-center shrink-0 overflow-hidden font-bold text-[10px]"
                style={{ background: "linear-gradient(135deg, #0bd0d7, #087f97)" }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  displayName.substring(0, 2).toUpperCase()
                )}
              </div>
              <span className="text-[11px] font-medium text-[#d7e4ec] hidden sm:block group-hover:text-[#eaf3f8] transition-colors">
                {displayName}
              </span>
              <LogOut className="size-3.5 text-[#8da2b4] opacity-0 group-hover:opacity-100 group-hover:text-[#ef4444] transition-all hidden sm:block" />
            </div>
          </div>
        </header>

        <div className="flex-1">{children ?? <Outlet />}</div>
      </main>

      {/* Command Palette */}
      <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
      <div>
        <h1 className="text-base font-semibold text-foreground tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function ModuleBadge({ letter }: { letter: string }) {
  return (
    <span className="size-5 border border-brand/40 rounded flex items-center justify-center text-[10px] text-brand">
      {letter}
    </span>
  );
}
