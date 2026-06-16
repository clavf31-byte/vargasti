import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { KpiCard } from "@/components/KpiCard";
import { useAuth } from "@/contexts/AuthContext";
import { useCRMMetrics } from "@/hooks/useCRMMetrics";
import { useEffect, useState } from "react";
import {
  Users, FileText, DollarSign,
  Plus, TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard · VargasTI Lab" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const { clientesCount, orcamentosCount, pagamentosCount } = useCRMMetrics();

  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "user";

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  const kpis = [
    {
      label: "Clientes",
      value: String(clientesCount).padStart(2, "0"),
      icon: Users,
      to: "/crm/clientes" as const,
      gradient: "blue" as const,
      progress: Math.min(clientesCount * 25, 100),
    },
    {
      label: "Orçamentos",
      value: String(orcamentosCount).padStart(2, "0"),
      icon: FileText,
      to: "/crm/orcamentos" as const,
      gradient: "purple" as const,
      progress: Math.min(orcamentosCount * 20, 100),
    },
    {
      label: "Pagamentos",
      value: String(pagamentosCount).padStart(2, "0"),
      icon: DollarSign,
      to: "/crm/pagamentos" as const,
      gradient: "amber" as const,
      progress: Math.min(pagamentosCount * 25, 100),
    },
  ];

  const actions = [
    {
      to: "/crm/clientes" as const,
      icon: Users,
      label: "Novo Cliente",
      desc: "Cadastrar cliente",
      iconClass: "bg-brand/10 border-brand/20 text-brand",
    },
    {
      to: "/crm/orcamentos" as const,
      icon: FileText,
      label: "Novo Orçamento",
      desc: "Criar orçamento",
      iconClass: "bg-info/10 border-info/20 text-info",
    },
    {
      to: "/crm/pagamentos" as const,
      icon: DollarSign,
      label: "Registrar Pagamento",
      desc: "Adicionar pagamento",
      iconClass: "bg-warning/10 border-warning/20 text-warning",
    },
    {
      to: "/crm" as const,
      icon: TrendingUp,
      label: "CRM Dashboard",
      desc: "Ver dashboard CRM",
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


        {/* KPI CARDS */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-select" />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Métricas Principais</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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

      </div>
    </AppShell>
  );
}
