import { Link, useRouterState, Outlet } from "@tanstack/react-router";
import {
  LayoutDashboard, Wrench, NotebookPen, FolderKanban,
  Files, Settings, User, LogOut, Terminal,
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
        <Link to="/" className="px-4 py-4 flex items-center gap-2.5 hover:opacity-90 transition-opacity border-b border-border">
          <img src={vargasLogo} alt="VargasTI" className="size-7 object-contain" />
          <div>
            <h1 className="text-sm text-foreground leading-none">
              Vargas<span className="text-brand">TI</span>
            </h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">Lab v2.0</p>
          </div>
        </Link>

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          <div className="px-2 pb-2">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">&gt;_MODULES</span>
          </div>
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-brand/10 text-brand border border-brand/20"
                    : "text-muted-foreground hover:bg-surface-2 hover:text-foreground border border-transparent"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span>{label}</span>
                {active && <span className="ml-auto size-1.5 rounded-full bg-brand status-pulse" />}
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
            <div className="text-xs flex-1 min-w-0">
              <p className="text-foreground truncate">{displayName}</p>
              <p className="text-muted-foreground truncate text-[10px]">{user?.email}</p>
            </div>
            <button
              onClick={signOut}
              title="Sair"
              className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-brand hover:bg-brand/10 transition-colors"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-11 border-b border-border bg-surface/80 backdrop-blur flex items-center justify-between px-5 sticky top-0 z-10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Terminal className="size-3.5" />
            <span>vargasti@lab:~$</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-brand/5 border border-brand/20 rounded-md">
              <span className="size-1.5 bg-brand rounded-full status-pulse" />
              <span className="text-[10px] text-brand uppercase tracking-wider">online</span>
            </div>
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
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">&gt;_</div>
        <h1 className="text-base text-foreground tracking-tight">{title}</h1>
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
