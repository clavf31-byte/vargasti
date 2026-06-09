import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import {
  NotebookPen, Wrench, FolderKanban, Files,
  FileSpreadsheet, Plus, ChevronRight, TrendingUp, Clock,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard · VargasTI Lab" }] }),
  component: Dashboard,
});

type ActivityItem = {
  id: string;
  type: "note" | "project";
  label: string;
  time: string;
};

function Dashboard() {
  const { user } = useAuth();
  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "user";

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  const [notesCount, setNotesCount] = useState<number>(0);
  const [projectsCount, setProjectsCount] = useState<number>(0);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const results = await Promise.allSettled([
          supabase.from("notes").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
          supabase.from("projects").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
          supabase.from("notes").select("id, title, updated_at").eq("user_id", user!.id).order("updated_at", { ascending: false }).limit(4),
          supabase.from("projects").select("id, name, updated_at").eq("user_id", user!.id).order("updated_at", { ascending: false }).limit(4),
        ]);
        const get = <T,>(i: number): T | undefined =>
          results[i].status === "fulfilled" ? ((results[i] as PromiseFulfilledResult<any>).value as T) : undefined;
        const nc = get<{ count: number | null }>(0)?.count ?? 0;
        const pc = get<{ count: number | null }>(1)?.count ?? 0;
        const notes = get<{ data: any[] | null }>(2)?.data ?? [];
        const projects = get<{ data: any[] | null }>(3)?.data ?? [];
        setNotesCount(nc);
        setProjectsCount(pc);
        const combined: ActivityItem[] = [
          ...notes.map((n: any) => ({ id: String(n.id), type: "note" as const, label: n.title || "Sem título", time: n.updated_at })),
          ...projects.map((p: any) => ({ id: String(p.id), type: "project" as const, label: p.name || "Sem nome", time: p.updated_at })),
        ];
        combined.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        setActivity(combined.slice(0, 6));
      } catch (e) {
        console.error("Dashboard load failed", e);
      }
    }
    load();
  }, [user]);

  const kpis = [
    {
      label: "Anotações",
      value: String(notesCount).padStart(2, "0"),
      icon: NotebookPen,
      to: "/anotacoes" as const,
      color: "brand" as const,
    },
    {
      label: "Projetos",
      value: String(projectsCount).padStart(2, "0"),
      icon: FolderKanban,
      to: "/projetos" as const,
      color: "info" as const,
    },
    {
      label: "Tools",
      value: "01",
      icon: Wrench,
      to: "/ferramentas" as const,
      color: "warning" as const,
    },
    {
      label: "Arquivos",
      value: "—",
      icon: Files,
      to: "/arquivos" as const,
      color: "muted" as const,
    },
  ];

  const kpiColorMap = {
    brand: {
      icon: "bg-brand/10 border-brand/20 text-brand",
      value: "text-brand",
      hover: "hover:border-brand/30 hover:shadow-[0_0_20px_oklch(0.73_0.21_145/0.08)]",
    },
    info: {
      icon: "bg-info/10 border-info/20 text-info",
      value: "text-info",
      hover: "hover:border-info/30",
    },
    warning: {
      icon: "bg-warning/10 border-warning/20 text-warning",
      value: "text-warning",
      hover: "hover:border-warning/30",
    },
    muted: {
      icon: "bg-surface-2 border-border text-muted-foreground",
      value: "text-muted-foreground",
      hover: "hover:border-brand/20",
    },
  };

  const actions = [
    {
      to: "/anotacoes" as const,
      icon: NotebookPen,
      label: "Nova Anotação",
      desc: "Criar nota ou rascunho",
      iconClass: "bg-brand/10 border-brand/20 text-brand",
    },
    {
      to: "/projetos" as const,
      icon: FolderKanban,
      label: "Novo Projeto",
      desc: "Iniciar um projeto",
      iconClass: "bg-info/10 border-info/20 text-info",
    },
    {
      to: "/ferramentas/excel" as const,
      icon: FileSpreadsheet,
      label: "Editor Excel",
      desc: "Importar planilha .xlsx",
      iconClass: "bg-warning/10 border-warning/20 text-warning",
    },
    {
      to: "/arquivos" as const,
      icon: Files,
      label: "Arquivos",
      desc: "Gerenciar arquivos",
      iconClass: "bg-surface-2 border-border text-muted-foreground",
    },
  ];

  const badgeConfig = {
    note: { label: "NOTE", class: "bg-brand/10 text-brand border-brand/20" },
    project: { label: "PROJ", class: "bg-info/10 text-info border-info/20" },
  };

  return (
    <AppShell>
      <div className="p-4 md:p-5 space-y-4">

        {/* Hero */}
        <div className="relative overflow-hidden bg-surface border border-border rounded-xl p-5">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-brand/6 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-8 w-32 h-32 bg-info/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                {now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <h1 className="text-xl font-bold text-foreground mt-1 tracking-tight">
                {greeting},{" "}
                <span className="text-brand">{firstName}</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Seu laboratório digital de testes, projetos e soluções.
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                <Link
                  to="/ferramentas/excel"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand/10 border border-brand/20 rounded-lg text-xs font-medium text-brand hover:bg-brand/15 transition-colors"
                >
                  <FileSpreadsheet className="size-3" />
                  Importar Excel
                </Link>
                <Link
                  to="/anotacoes"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-white/5 transition-colors"
                >
                  <Plus className="size-3" />
                  Nova Anotação
                </Link>
                <Link
                  to="/projetos"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-white/5 transition-colors"
                >
                  <Plus className="size-3" />
                  Novo Projeto
                </Link>
                <Link
                  to="/ferramentas"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-white/5 transition-colors"
                >
                  <Wrench className="size-3" />
                  Abrir Tools
                </Link>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-3xl font-bold text-brand tabular-nums tracking-tight">
                {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="flex items-center justify-end gap-1.5 mt-1">
                <span className="size-1.5 bg-brand rounded-full status-pulse" />
                <span className="text-[10px] text-muted-foreground">system ok</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map(({ label, value, icon: Icon, to, color }) => {
            const c = kpiColorMap[color];
            return (
              <Link
                key={label}
                to={to}
                className={`group bg-surface border border-border rounded-xl p-4 ${c.hover} transition-all duration-200`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`size-8 rounded-lg border grid place-items-center ${c.icon}`}>
                    <Icon className="size-4" />
                  </div>
                  <ChevronRight className="size-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors mt-0.5" />
                </div>
                <div className={`text-2xl font-bold tabular-nums leading-none ${c.value}`}>{value}</div>
                <div className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wide">{label}</div>
              </Link>
            );
          })}
        </div>

        {/* Actions + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Quick actions */}
          <div className="lg:col-span-2 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="size-3.5 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Acesso Rápido</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {actions.map(({ to, icon: Icon, label, desc, iconClass }) => (
                <Link
                  key={to}
                  to={to}
                  className="group bg-surface border border-border rounded-xl p-3.5 hover:border-border/80 hover:bg-white/5 transition-all duration-200"
                >
                  <div className={`size-8 rounded-lg border grid place-items-center mb-2.5 ${iconClass}`}>
                    <Icon className="size-3.5" />
                  </div>
                  <p className="text-xs font-medium text-foreground group-hover:text-brand transition-colors leading-tight">{label}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{desc}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div className="lg:col-span-3 bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="size-3.5 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Atividade Recente</p>
            </div>

            {activity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <div className="size-10 rounded-full bg-surface-2 border border-border grid place-items-center">
                  <Clock className="size-4 text-muted-foreground/50" />
                </div>
                <p className="text-xs text-muted-foreground">Nenhuma atividade ainda.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {activity.map((item, i) => {
                  const badge = badgeConfig[item.type];
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider border ${badge.class}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs text-foreground truncate flex-1">{item.label}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                        {new Date(item.time).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
