import { Link, useRouterState, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, Wrench, NotebookPen, Search, User, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import vargasLogo from "@/assets/vargasti-icon.png";
import { useAuth } from "@/contexts/AuthContext";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/ferramentas", label: "Ferramentas", icon: Wrench },
  { to: "/anotacoes", label: "Anotações", icon: NotebookPen },
] as const;

export function AppShell({ children }: { children?: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut } = useAuth();
  const displayName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Usuário";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-surface flex flex-col shrink-0 sticky top-0 h-screen">
        <Link to="/" className="p-6 flex items-center gap-3 hover:opacity-90 transition-opacity">
          <img src={vargasLogo} alt="VargasTI" className="size-10 object-contain drop-shadow-[0_0_12px_rgba(34,197,94,0.25)]" />
          <div>
            <h1 className="text-base font-semibold text-foreground tracking-tight leading-none">
              Vargas<span className="text-brand text-cyan-700">TI</span>
            </h1>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-1">Knowledge Hub</p>
          </div>
        </Link>

        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          <div className="px-3 py-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Módulos</span>
          </div>
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand/10 text-brand"
                    : "text-foreground/70 hover:bg-white/5 hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                <span>{label}</span>
                {active && <span className="ml-auto size-1.5 rounded-full bg-brand status-pulse" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="size-9 rounded-full bg-secondary outline outline-1 outline-white/10 grid place-items-center overflow-hidden shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="size-full object-cover" />
              ) : (
                <User className="size-4 text-muted-foreground" />
              )}
            </div>
            <div className="text-xs flex-1 min-w-0">
              <p className="text-foreground font-medium truncate">{displayName}</p>
              <p className="text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button
              onClick={signOut}
              title="Sair"
              className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-surface/60 backdrop-blur-md flex items-center justify-between px-6 md:px-8 sticky top-0 z-10">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Pesquisa global..."
              className="w-full bg-white/5 border border-border rounded-md py-2 pl-10 pr-12 text-sm focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20 transition-all font-mono placeholder:text-muted-foreground"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-background text-[10px] font-mono text-muted-foreground">
              ⌘K
            </kbd>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-brand/5 border border-brand/20 rounded-full">
              <span className="size-2 bg-brand rounded-full status-pulse" />
              <span className="text-[10px] font-mono text-brand uppercase tracking-wider">System Online</span>
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
    <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function ModuleBadge({ letter }: { letter: string }) {
  return (
    <span className="size-5 border border-brand/40 rounded flex items-center justify-center text-[10px] font-mono font-bold text-brand">
      {letter}
    </span>
  );
}
