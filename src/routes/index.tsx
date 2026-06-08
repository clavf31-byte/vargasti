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
          ...notes.map((n: any) => ({ id: String(n.id), type: "note" as const, label: n.title || "Sem título", time: n.updated_at })),
          ...projects.map((p: any) => ({ id: String(p.id), type: "project" as const, label: p.name || "Sem nome", time: p.updated_at })),
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
    { label: "Notes", value: String(notesCount).padStart(2, "0"), sub: "anotações", to: "/anotacoes" as const },
    { label: "Projects", value: String(projectsCount).padStart(2, "0"), sub: "projetos", to: "/projetos" as const },
    { label: "Tools", value: "01", sub: "utilitários", to: "/ferramentas" as const },
    { label: "Files", value: "—", sub: "arquivos", to: "/arquivos" as const },
  ];

  const shortcuts = [
    { to: "/anotacoes" as const, icon: NotebookPen, label: "Nova Anotação" },
    { to: "/projetos" as const, icon: FolderKanban, label: "Novo Projeto" },
    { to: "/ferramentas/excel" as const, icon: Wrench, label: "Excel Tool" },
    { to: "/arquivos" as const, icon: Files, label: "Arquivos" },
  ];

  return (
    <AppShell>
      <div className="p-5 md:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">
              {now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h1 className="text-lg text-foreground mt-0.5">
              {greeting},{" "}
              <span className="text-brand">{firstName}</span>
            </h1>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            <div className="text-brand text-base">{now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
            <div>system ok</div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-3">
          {kpis.map(({ label, value, sub, to }) => (
            <Link
              key={label}
              to={to}
              className="bg-surface border border-border rounded-md p-4 hover:border-brand/40 hover:bg-brand/5 transition-all group"
            >
              <div className="text-xs text-muted-foreground mb-1">{label}</div>
              <div className="font-vt323 text-4xl text-brand leading-none">{value}</div>
              <div className="text-xs text-muted-foreground mt-1">{sub}</div>
            </Link>
          ))}
        </div>

        {/* Shortcuts + Activity */}
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-2 bg-surface border border-border rounded-md p-4 space-y-1">
            <p className="text-xs text-muted-foreground mb-3">&gt;_ Quick Access</p>
            {shortcuts.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-all group"
              >
                <Icon className="size-3.5 shrink-0" />
                <span>{label}</span>
                <ArrowRight className="size-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>

          <div className="col-span-3 bg-surface border border-border rounded-md p-4">
            <p className="text-xs text-muted-foreground mb-3">&gt;_ Activity Log</p>
            <div className="space-y-2">
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3 text-center">Nenhuma atividade ainda</p>
              ) : (
                activity.map((item) => (
                  <div key={item.id} className="flex items-center gap-2.5 text-sm">
                    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide ${
                      item.type === "note"
                        ? "bg-brand/10 text-brand border border-brand/20"
                        : "bg-info/10 text-info border border-info/20"
                    }`}>
                      {item.type === "note" ? "NOTE" : "PROJ"}
                    </span>
                    <span className="text-foreground truncate">{item.label}</span>
                    <span className="text-muted-foreground shrink-0 ml-auto text-xs">
                      {new Date(item.time).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modules */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { to: "/anotacoes" as const, icon: NotebookPen, label: "Anotações", desc: "Notas e rascunhos" },
            { to: "/projetos" as const, icon: FolderKanban, label: "Projetos", desc: "Gestão de projetos" },
            { to: "/ferramentas" as const, icon: Wrench, label: "Tools", desc: "Utilitários e scripts" },
          ].map(({ to, icon: Icon, label, desc }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-3 bg-surface border border-border rounded-md px-4 py-3 hover:border-brand/40 hover:bg-brand/5 transition-all"
            >
              <Icon className="size-4 text-muted-foreground group-hover:text-brand transition-colors" />
              <div className="min-w-0">
                <div className="text-sm text-foreground group-hover:text-brand transition-colors">{label}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
