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
      value: "∞",
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
      <div className="p-6 space-y-6 bg-background min-h-screen">

        {/* HEADER COM RELÓGIO GRANDE */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              {now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h1 className="text-2xl font-bold text-foreground mt-2">
              {greeting}, <span className="text-brand">{firstName}</span>
            </h1>
          </div>
          <div className="text-right">
            <div className="text-6xl font-light text-brand font-mono tabular-nums">
              {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="flex items-center justify-end gap-1.5 mt-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400 font-medium">Online</span>
            </div>
          </div>
        </div>

        {/* VISÃO DE HOJE + VERSÃO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <VisionOfToday
              notesCount={notesCount}
              projectsCount={projectsCount}
              filesCount={0}
              toolsCount={1}
            />
          </div>
          <SystemInfo />
        </div>

        {/* KPI CARDS */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Métricas Principais</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        </div>

        {/* ATALHOS RÁPIDOS + ATIVIDADE RECENTE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ATALHOS */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Atalhos Rápidos</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {actions.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="bg-surface border border-border rounded-lg p-3 text-center transition-all hover:border-border/80 hover:bg-surface-2"
                >
                  <Icon className="w-5 h-5 text-brand mx-auto mb-2" />
                  <p className="text-xs font-medium text-foreground">{label}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* ATIVIDADE RECENTE */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Atividade Recente</p>
            </div>
            <div className="space-y-2">
              {activity.length === 0 ? (
                <div className="bg-surface border border-border rounded-lg p-6 text-center">
                  <p className="text-xs text-muted-foreground">Nenhuma atividade ainda</p>
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
      </div>
    </AppShell>
  );
}
