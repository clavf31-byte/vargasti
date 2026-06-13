import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { KpiCard } from "@/components/KpiCard";
import { ActivityCard } from "@/components/ActivityCard";
import { VisionOfToday } from "@/components/VisionOfToday";
import { SystemInfo } from "@/components/SystemInfo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import {
  NotebookPen, Wrench, FolderKanban, Files,
  FileSpreadsheet, Plus, TrendingUp, Clock,
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
  const [filesCount, setFilesCount] = useState<number>(0);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const results = await Promise.allSettled([
          supabase.from("notes").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
          supabase.from("projects").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
          supabase.from("arquivos").select("*", { count: "exact", head: true }),
          supabase.from("notes").select("id, title, updated_at").eq("user_id", user!.id).order("updated_at", { ascending: false }).limit(4),
          supabase.from("projects").select("id, name, updated_at").eq("user_id", user!.id).order("updated_at", { ascending: false }).limit(4),
        ]);
        const get = <T,>(i: number): T | undefined =>
          results[i].status === "fulfilled" ? ((results[i] as PromiseFulfilledResult<any>).value as T) : undefined;
        const nc = get<{ count: number | null }>(0)?.count ?? 0;
        const pc = get<{ count: number | null }>(1)?.count ?? 0;
        const fc = get<{ count: number | null }>(2)?.count ?? 0;
        const notes = get<{ data: any[] | null }>(3)?.data ?? [];
        const projects = get<{ data: any[] | null }>(4)?.data ?? [];
        setNotesCount(nc);
        setProjectsCount(pc);
        setFilesCount(fc);
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
      gradient: "teal" as const,
      progress: Math.min(notesCount * 20, 100),
    },
    {
      label: "Projetos",
      value: String(projectsCount).padStart(2, "0"),
      icon: FolderKanban,
      to: "/projetos" as const,
      gradient: "blue" as const,
      progress: Math.min(projectsCount * 30, 100),
    },
    {
      label: "Tools",
      value: "01",
      icon: Wrench,
      to: "/ferramentas" as const,
      gradient: "purple" as const,
      progress: 100,
    },
    {
      label: "Arquivos",
      value: String(filesCount).padStart(2, "0"),
      icon: Files,
      to: "/arquivos" as const,
      gradient: "amber" as const,
      progress: 100,
    },
  ];

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

  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">

        {/* HEADER COM RELÓGIO GRANDE */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
              {now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mt-3 tracking-tight">
              {greeting}, <span className="text-brand">{firstName}</span>
            </h1>
          </div>
          <div className="text-right shrink-0">
            <div className="text-5xl md:text-6xl font-light text-brand font-mono tabular-nums leading-none">
              {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="flex items-center justify-end gap-1.5 mt-3">
              <span className="size-1.5 bg-brand rounded-full status-pulse" />
              <span className="text-xs text-brand font-medium">Online</span>
            </div>
          </div>
        </div>

        {/* ATALHOS RÁPIDOS */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Plus className="size-4 text-select" />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Atalhos Rápidos</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {actions.map(({ to, icon: Icon, label, desc, iconClass }) => (
              <Link
                key={to}
                to={to}
                className="card-selectable hover:card-selectable-hover p-4 flex flex-col items-start gap-3"
              >
                <div className={`size-10 rounded-lg border ${iconClass} grid place-items-center`}>
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* VISÃO DE HOJE + SYSTEM INFO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <VisionOfToday
              notesCount={notesCount}
              projectsCount={projectsCount}
              filesCount={filesCount}
              toolsCount={1}
            />
          </div>
          <SystemInfo />
        </div>

        {/* KPI CARDS */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-select" />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Métricas Principais</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {kpis.map(({ label, value, icon, to, gradient, progress }) => (
              <KpiCard
                key={label}
                label={label}
                value={value}
                icon={icon}
                to={to}
                gradient={gradient}
                progress={progress}
              />
            ))}
          </div>
        </section>

        {/* ATIVIDADE RECENTE */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-select" />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Atividade Recente</p>
          </div>
          <div className="space-y-2.5">
            {activity.length === 0 ? (
              <div className="card-graphite border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">Nenhuma atividade ainda</p>
              </div>
            ) : (
              activity.map((item) => (
                <ActivityCard
                  key={item.id}
                  type={item.type}
                  title={item.label}
                  description={`Atualizado em ${new Date(item.time).toLocaleDateString("pt-BR")}`}
                  date={new Date(item.time).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                  timeAgo="há pouco"
                />
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
