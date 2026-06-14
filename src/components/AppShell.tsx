import { Link, useRouterState, Outlet } from "@tanstack/react-router";
import {
  LayoutDashboard, Mail, FileSpreadsheet, NotebookPen, FolderKanban,
  Files, Settings, User, LogOut, Menu, X, Search, ShieldCheck, ChevronDown, MessageCircle, Wrench,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import vargasLogo from "@/assets/vargasti-icon.png";
import { useAuth } from "@/contexts/AuthContext";

const NAV_MODULES = [
  {
    group: "🛠️ Ferramentas",
    items: [
      { to: "/ferramentas/emails", label: "Email Agent", icon: Mail },
      { to: "/ferramentas/excel", label: "Excel Tool", icon: FileSpreadsheet },
      { to: "/ferramentas/whatsapp", label: "WhatsApp", icon: MessageCircle },
    ],
  },
  {
    group: "📝 Projetos & Notas",
    items: [
      { to: "/projetos", label: "Projetos", icon: FolderKanban },
      { to: "/anotacoes", label: "Anotações", icon: NotebookPen },
    ],
  },
  {
    group: "💾 Storage",
    items: [
      { to: "/arquivos", label: "Arquivos", icon: Files },
    ],
  },
];

const NAV_ADMIN = [
  {
    group: "👨‍💻 Admin",
    items: [
      { to: "/admin", label: "Usuários", icon: ShieldCheck },
    ],
  },
];

export function AppShell({ children }: { children?: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "🛠️ Ferramentas": false,
    "📝 Projetos & Notas": false,
    "💾 Storage": false,
  });

  const displayName =
    user?.user_metadata?.full_name?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "user";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const isAdmin = (user?.app_metadata as { role?: string } | undefined)?.role === "admin";

  const ALL_MODULES = isAdmin ? [...NAV_MODULES, ...NAV_ADMIN] : NAV_MODULES;

  const currentPage = (() => {
    for (const mod of ALL_MODULES) {
      const item = mod.items.find(({ to }) =>
        to === "/" ? pathname === "/" : pathname.startsWith(to)
      );
      if (item) return item.label;
    }
    return "VargasTI Lab";
  })();

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const isItemActive = (to: string) => to === "/" ? pathname === "/" : pathname.startsWith(to);

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
            to="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 flex-1"
          >
            <div
              className="w-11 h-11 rounded-lg grid place-items-center font-bold text-lg shrink-0"
              style={{
                background: "linear-gradient(135deg, #0bd0d7, #08718b)",
                boxShadow: "0 0 28px rgba(0, 213, 230, .28)",
              }}
            >
              V
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-[#eaf3f8] leading-tight">VargasTI</h1>
              <span className="text-[10px] text-[#13c8d3] font-semibold tracking-wide">LAB v2.0</span>
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
          to="/"
          onClick={() => setSidebarOpen(false)}
          className={`mx-3.5 mt-3 px-3 py-3 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
            pathname === "/"
              ? "text-[#eaf3f8]"
              : "text-[#d7e4ec] hover:text-[#eaf3f8]"
          }`}
          style={{
            background: pathname === "/"
              ? "linear-gradient(135deg, #087f97, #0fb7c7)"
              : "rgba(255,255,255,.035)",
            border: pathname === "/"
              ? "none"
              : "1px solid rgba(255,255,255,.055)",
            boxShadow: pathname === "/"
              ? "0 10px 24px rgba(0,0,0,.22)"
              : "none",
          }}
        >
          ▦ Dashboard
        </Link>

        {/* Navigation */}
        <nav className="flex-1 px-3.5 py-4 space-y-3 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#6f879c]">
            Módulos
          </p>

          {ALL_MODULES.map(({ group, items }) => (
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
                <span className="text-sm font-bold">{group}</span>
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

        {/* Config */}
        <Link
          to="/config"
          onClick={() => setSidebarOpen(false)}
          className="mx-3.5 mb-3 px-3 py-3 rounded-lg text-[#d7e4ec] font-bold text-sm flex items-center gap-2 transition-all hover:text-[#eaf3f8]"
          style={{
            background: "rgba(255,255,255,.035)",
            border: "1px solid rgba(255,255,255,.055)",
          }}
        >
          <Settings className="size-4" />
          Configurações
        </Link>

        {/* Shortcuts */}
        <div className="border-t" style={{ borderColor: "rgba(255,255,255,.08)" }}>
          <p className="px-4 pt-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#6f879c]">
            Atalhos
          </p>
          <div className="px-3.5 pb-3 space-y-2">
            <div
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
              <span>⌕ Busca rápida</span>
              <span className="text-[9px] px-1.5 py-0.5 border rounded" style={{ borderColor: "rgba(255,255,255,.14)", background: "rgba(255,255,255,.06)" }}>
                CTRL K
              </span>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-3.5 border-t" style={{ borderColor: "rgba(255,255,255,.08)" }}>
          <div
            className="flex items-center gap-2.5 p-3 rounded-xl transition-all cursor-pointer group"
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
            <div
              className="w-9 h-9 rounded-full grid place-items-center shrink-0 overflow-hidden font-bold text-xs"
              style={{ background: "linear-gradient(135deg, #0bd0d7, #087f97)" }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                displayName.substring(0, 2).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-[#eaf3f8] truncate">{displayName}</p>
              <p className="text-[9px] text-[#8da2b4] truncate">{user?.email}</p>
            </div>
            <button
              onClick={signOut}
              title="Sair"
              className="shrink-0 p-1.5 rounded-md text-[#8da2b4] hover:text-[#ef4444] transition-colors opacity-0 group-hover:opacity-100"
            >
              <LogOut className="size-3.5" />
            </button>
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

          {/* Page title (desktop) */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-[10px] text-[#8da2b4] uppercase tracking-widest">VargasTI</span>
            <span className="text-[#8da2b4]/30">/</span>
            <span className="text-[10px] text-[#eaf3f8] font-medium">{currentPage}</span>
          </div>

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              title="Busca global"
              className="p-2 rounded-lg text-[#8da2b4] hover:text-[#eaf3f8] transition-colors"
            >
              <Search className="size-3.5" />
            </button>

            <div className="h-4 w-px" style={{ background: "rgba(0, 213, 230, .16)" }} />

            <div className="flex items-center gap-1.5">
              <span className="size-1.5 bg-[#13c8d3] rounded-full" style={{ animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
              <span className="text-[10px] text-[#8da2b4] hidden sm:block">online</span>
            </div>
          </div>
        </header>

        <div className="flex-1">{children ?? <Outlet />}</div>
      </main>
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
