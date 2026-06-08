import { Link, useRouterState, Outlet } from "@tanstack/react-router";
import {
  LayoutDashboard, Wrench, NotebookPen, FolderKanban,
  Files, Settings, User, LogOut,
} from "lucide-react";
import type { ReactNode } from "react";
import vargasLogo from "@/assets/vargasti-icon.png";
import { useAuth } from "@/contexts/AuthContext";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/anotacoes", label: "Anotações", icon: NotebookPen },
  { to: "/ferramentas", label: "Tools", icon: Wrench },
  { to: "/projetos", label: "Projetos", icon: FolderKanban },
  { to: "/arquivos", label: "Arquivos", icon: Files },
  { to: "/config", label: "Config", icon: Settings },
] as const;

export function AppShell({ children }: { children?: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut } = useAuth();
  const displayName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "user";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-border bg-surface flex flex-col shrink-0 sticky top-0 h-screen">
        <Link to="/" className="px-4 py-5 flex flex-col items-center gap-2 hover:opacity-90 transition-opacity border-b border-border">
          <img src={vargasLogo} alt="VargasTI" className="size-12 object-contain" />
          <div className="text-center">
            <h1 className="text-sm font-semibold text-foreground leading-none">
              Vargas<span className="text-brand">TI</span>
            </h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">Lab v2.0</p>
          </div>
        </Link>

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Menu
          </p>
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand/10 text-brand"
                    : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span>{label}</span>
                {active && <span className="ml-auto size-1.5 rounded-full bg-brand" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 px-1 py-1">
            <div className="size-8 rounded-full bg-secondary border border-border grid place-items-center overflow-hidden shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="size-full object-cover" />
              ) : (
                <User className="size-3.5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button
              onClick={signOut}
              title="Sair"
              className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-11 border-b border-border bg-surface/80 backdrop-blur flex items-center justify-between px-5 sticky top-0 z-10">
          <p className="text-sm font-medium text-foreground">VargasTI Hub</p>
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 bg-brand rounded-full status-pulse" />
            <span className="text-xs text-muted-foreground">online</span>
          </div>
        </header>

        <div className="flex-1">{children ?? <Outlet />}</div>
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
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
