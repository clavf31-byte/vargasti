import { Link, useRouterState, Outlet } from "@tanstack/react-router";
import {
  LayoutDashboard, Wrench, NotebookPen, FolderKanban,
  Files, Settings, User, LogOut, Menu, X, Search, ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import vargasLogo from "@/assets/vargasti-icon.png";
import { useAuth } from "@/contexts/AuthContext";

const NAV_BASE = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/anotacoes", label: "Anotações", icon: NotebookPen },
  { to: "/ferramentas", label: "Tools", icon: Wrench },
  { to: "/projetos", label: "Projetos", icon: FolderKanban },
  { to: "/arquivos", label: "Arquivos", icon: Files },
  { to: "/config", label: "Config", icon: Settings },
] as const;

const NAV_ADMIN = [
  { to: "/admin", label: "Usuários", icon: ShieldCheck },
] as const;

export function AppShell({ children }: { children?: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayName =
    user?.user_metadata?.full_name?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "user";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const isAdmin = (user?.app_metadata as { role?: string } | undefined)?.role === "admin";

  const ALL_NAV = isAdmin ? [...NAV_BASE, ...NAV_ADMIN] : NAV_BASE;

  const currentPage = ALL_NAV.find(({ to }) =>
    to === "/" ? pathname === "/" : pathname.startsWith(to)
  )?.label ?? "VargasTI Hub";

  return (
    <div className="min-h-screen flex bg-background">
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
          fixed inset-y-0 left-0 z-50 w-60 flex flex-col shrink-0
          bg-surface border-r border-border
          transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-border/50">
          <Link
            to="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3.5 hover:opacity-90 transition-opacity"
          >
            <div className="size-[4.5rem] rounded-[18px] bg-brand/10 border border-brand/20 grid place-items-center shrink-0 shadow-[0_0_32px_rgba(59,220,138,.10)]">
              <img src={vargasLogo} alt="VargasTI" className="size-[42px] object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-foreground leading-none tracking-tight">
                Vargas<span className="text-brand">TI</span>
              </h1>
              <p className="text-[10px] text-muted-foreground mt-1 tracking-wide">Lab v2.0</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 pb-2.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Navegação
          </p>
          {ALL_NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={`
                  relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-150
                  ${
                    active
                      ? "bg-brand/10 text-brand"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }
                `}
              >
                {active && (
                  <span className="absolute left-0 inset-y-1.5 w-0.5 bg-brand rounded-r-full" />
                )}
                <Icon className={`size-4 shrink-0 transition-colors ${active ? "text-brand" : ""}`} />
                <span>{label}</span>
                {active && (
                  <span className="ml-auto size-1.5 rounded-full bg-brand/60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Build info */}
        <div className="px-4 py-2 border-t border-border/30">
          <p className="text-[9px] text-muted-foreground/40 font-mono leading-relaxed">
            v{__APP_VERSION__} · build {__BUILD_NUMBER__}
          </p>
          <p className="text-[8px] text-muted-foreground/30 font-mono">
            {__GIT_HASH__} · {__BUILD_DATE__}
          </p>
        </div>

        {/* User */}
        <div className="p-3 border-t border-border/50">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors group">
            <div className="relative shrink-0">
              <div className="size-8 rounded-full bg-secondary border border-border grid place-items-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="size-full object-cover" />
                ) : (
                  <User className="size-3.5 text-muted-foreground" />
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-brand border-2 border-surface" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-foreground truncate leading-tight">{displayName}</p>
              <p className="text-[9px] text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button
              onClick={signOut}
              title="Sair"
              className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Header */}
        <header className="h-12 border-b border-border bg-surface/80 backdrop-blur-md flex items-center gap-3 px-4 sticky top-0 z-30 shrink-0">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
          >
            <Menu className="size-4" />
          </button>

          {/* Page title (desktop) */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">VargasTI</span>
            <span className="text-muted-foreground/30">/</span>
            <span className="text-[10px] text-foreground font-medium">{currentPage}</span>
          </div>

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              title="Busca global"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
            >
              <Search className="size-3.5" />
            </button>

            <div className="h-4 w-px bg-border/60" />

            <div className="flex items-center gap-1.5">
              <span className="size-1.5 bg-brand rounded-full status-pulse" />
              <span className="text-[10px] text-muted-foreground hidden sm:block">online</span>
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
