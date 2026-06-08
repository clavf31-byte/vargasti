import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { NotebookPen, Wrench, FolderKanban, Files, ChevronRight, ArrowRight } from "lucide-react";

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
  const greeting = hour < 12 ? "BOM DIA" : hour < 18 ? "BOA TARDE" : "BOA NOITE";

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
          supabase.from("notes").select("id, title, updated_at").eq("user_id", user!.id).order("updated_at", { ascending: false }).limit(3),
          supabase.from("projects").select("id, name, updated_at").eq("user_id", user!.id).order("updated_at", { ascending: false }).limit(3),
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
          ...notes.filter(Boolean).map((n: any) => ({ id: String(n?.id ?? Math.random()), type: "note" as const, label: n?.title || "Sem título", time: n?.updated_at ?? new Date().toISOString() })),
          ...projects.filter(Boolean).map((p: any) => ({ id: String(p?.id ?? Math.random()), type: "project" as const, label: p?.name || "Sem nome", time: p?.updated_at ?? new Date().toISOString() })),
        ];
        combined.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        setActivity(combined.slice(0, 5));
      } catch (e) {
        console.error("Dashboard load failed", e);
      }
    }
    load();
  }, [user]);


  const kpis = [
    { label: "NOTES", value: String(notesCount).padStart(2, "0"), sub: "anotações", to: "/anotacoes" as const },
    { label: "PROJECTS", value: String(projectsCount).padStart(2, "0"), sub: "projetos", to: "/projetos" as const },
    { label: "TOOLS", value: "01", sub: "utilitários", to: "/ferramentas" as const },
    { label: "FILES", value: "??", sub: "arquivos", to: "/arquivos" as const },
  ];

  const shortcuts = [
    { to: "/anotacoes" as const, icon: NotebookPen, label: "Nova Anotação" },
    { to: "/projetos" as const, icon: FolderKanban, label: "Novo Projeto" },
    { to: "/ferramentas/excel" as const, icon: Wrench, label: "Excel Tool" },
    { to: "/arquivos" as const, icon: Files, label: "Arquivos" },
  ];

  return (
    <AppShell>
      <div className="p-4 md:p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-widest">
              {now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </div>
            <h1 className="text-sm text-foreground mt-0.5">
              {greeting},{" "}
              <span className="text-brand text-glow">{firstName.toUpperCase()}</span>
            </h1>
          </div>
          <div className="text-[9px] text-muted-foreground text-right">
            <div className="text-brand">{now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
            <div className="uppercase tracking-widest">system ok</div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-3">
          {kpis.map(({ label, value, sub, to }) => (
            <Link
              key={label}
              to={to}
              className="bg-surface border border-border rounded p-3 hover:border-brand/30 hover:bg-brand/5 transition-all group"
            >
              <div className="text-[9px] text-muted-foreground uppercase tracking-widest">{label}</div>
              <div className="font-vt323 text-4xl text-brand leading-none my-1 text-glow">{value}</div>
              <div className="text-[9px] text-muted-foreground">{sub}</div>
            </Link>
          ))}
        </div>

        {/* Shortcuts + Activity */}
        <div className="grid grid-cols-5 gap-3">
          {/* Quick Access */}
          <div className="col-span-2 bg-surface border border-border rounded p-3 space-y-1.5">
            <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-2">&gt;_quick access</div>
            {shortcuts.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2 px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-brand hover:bg-brand/5 border border-transparent hover:border-brand/20 transition-all group"
              >
                <Icon className="size-3 shrink-0" />
                <span>{label}</span>
                <ArrowRight className="size-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>

          {/* Activity Log */}
          <div className="col-span-3 bg-surface border border-border rounded p-3">
            <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-2">&gt;_activity log</div>
            <div className="space-y-1.5">
              {activity.length === 0 ? (
                <div className="text-[10px] text-muted-foreground py-4 text-center">Nenhuma atividade ainda</div>
              ) : (
                activity.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-[10px]">
                    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider ${
                      item.type === "note"
                        ? "bg-brand/10 text-brand border border-brand/20"
                        : "bg-info/10 text-info border border-info/20"
                    }`}>
                      {item.type === "note" ? "NOTE" : "PROJ"}
                    </span>
                    <span className="text-foreground truncate">{item.label}</span>
                    <span className="text-muted-foreground shrink-0 ml-auto">
                      {new Date(item.time).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modules row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { to: "/anotacoes" as const, icon: NotebookPen, label: "Anotações", desc: "Notas e rascunhos" },
            { to: "/projetos" as const, icon: FolderKanban, label: "Projetos", desc: "Gestão de projetos" },
            { to: "/ferramentas" as const, icon: Wrench, label: "Tools", desc: "Utilitários e automações" },
          ].map(({ to, icon: Icon, label, desc }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-3 bg-surface border border-border rounded px-3 py-2.5 hover:border-brand/30 hover:bg-brand/5 transition-all"
            >
              <Icon className="size-4 text-muted-foreground group-hover:text-brand transition-colors" />
              <div className="min-w-0">
                <div className="text-xs text-foreground group-hover:text-brand transition-colors">{label}</div>
                <div className="text-[9px] text-muted-foreground">{desc}</div>
              </div>
              <ChevronRight className="size-3 text-muted-foreground ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
