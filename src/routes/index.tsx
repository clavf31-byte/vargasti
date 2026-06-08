import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, ModuleBadge, PageHeader } from "@/components/AppShell";
import { projects, labTests, solutions, recentActivity, scripts, ideas } from "@/lib/mockData";
import { ArrowUpRight, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · VargasTI" },
      { name: "description", content: "Visão executiva da central VargasTI: projetos ativos, soluções, testes e atualizações." },
    ],
  }),
  component: Dashboard,
});

const kpis = [
  { label: "Projetos Ativos", value: projects.filter(p => p.status !== "archived").length, hint: "+2 este mês", barPct: 75 },
  { label: "Soluções Indexadas", value: solutions.length, hint: "+4 esta semana", barPct: 60 },
  { label: "Testes em Andamento", value: labTests.filter(t => t.status === "running").length, hint: `${labTests.length} total · 94% sucesso`, barPct: 40 },
  { label: "Biblioteca de Scripts", value: scripts.length, hint: "5 linguagens", barPct: 50 },
];

function Dashboard() {
  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-8">
        <PageHeader
          title="Executive Summary"
          subtitle={`Atualizado: ${new Date().toISOString().slice(0,19).replace("T", "_")}`}
        />

        {/* KPIs */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="bg-surface border border-border p-5 rounded-lg hover:border-brand/30 transition-colors">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">{k.label}</p>
              <p className="text-3xl font-bold text-foreground font-mono">{String(k.value).padStart(2, "0")}</p>
              <div className="mt-4 h-1 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-brand transition-all" style={{ width: `${k.barPct}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 font-mono">{k.hint}</p>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <ModuleBadge letter="P" /> Projetos Críticos
              </h2>
              <Link to="/projetos" className="text-xs text-brand hover:underline flex items-center gap-1">
                Ver todos <ArrowUpRight className="size-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.slice(0, 4).map((p) => (
                <Link
                  to="/projetos"
                  key={p.id}
                  className="group bg-surface border border-border p-5 rounded-lg hover:border-brand/30 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <StatusBadge status={p.status} />
                    <span className="text-[10px] font-mono text-muted-foreground">{p.version}</span>
                  </div>
                  <h4 className="text-foreground font-medium mb-1 group-hover:text-brand transition-colors">{p.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{p.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.tech.map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded bg-secondary text-muted-foreground text-[10px] font-mono">{t}</span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>

            {/* Lab activity */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <ModuleBadge letter="L" /> Laboratório
                </h2>
                <Link to="/laboratorio" className="text-xs text-brand hover:underline flex items-center gap-1">
                  Ver todos <ArrowUpRight className="size-3" />
                </Link>
              </div>
              <div className="bg-surface border border-border rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                    <tr>
                      <th className="px-5 py-3 font-medium">Experimento</th>
                      <th className="px-5 py-3 font-medium">Ambiente</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Resultado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {labTests.slice(0, 5).map((t) => (
                      <tr key={t.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3 text-foreground">{t.name}</td>
                        <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{t.environment}</td>
                        <td className="px-5 py-3"><TestStatusBadge status={t.status} /></td>
                        <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{t.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right column — logs */}
          <aside className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ModuleBadge letter="U" /> Últimas Atualizações
            </h2>

            <div className="bg-surface border border-border rounded-lg p-4 font-mono text-xs space-y-4">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-muted-foreground shrink-0">{a.time}</span>
                  <div className="flex-1 min-w-0">
                    <p className={
                      a.type === "success" ? "text-brand" :
                      a.type === "warning" ? "text-[color:var(--warning)]" :
                      a.type === "info" ? "text-[color:var(--info)]" :
                      "text-foreground"
                    }>
                      [{a.type.toUpperCase()}] {a.title}
                    </p>
                    <p className="text-muted-foreground truncate">{a.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 bg-gradient-to-br from-brand/15 to-transparent border border-brand/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="size-4 text-brand" />
                <h4 className="text-foreground font-medium">Ideias em destaque</h4>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {ideas[0].title}
              </p>
              <Link
                to="/ideias"
                className="block w-full text-center bg-brand text-brand-foreground py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-brand/90 transition-colors"
              >
                Abrir banco de ideias
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    development: { label: "DEVELOPMENT", cls: "bg-brand/10 text-brand border-brand/20" },
    stable: { label: "STABLE", cls: "bg-[color:var(--info)]/10 text-[color:var(--info)] border-[color:var(--info)]/20" },
    paused: { label: "PAUSED", cls: "bg-secondary text-muted-foreground border-border" },
    archived: { label: "ARCHIVED", cls: "bg-secondary text-muted-foreground border-border" },
  };
  const s = map[status] ?? map.paused;
  return <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${s.cls}`}>{s.label}</span>;
}

export function TestStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    running: "text-[color:var(--warning)]",
    completed: "text-brand",
    failed: "text-destructive",
  };
  return <span className={`font-mono text-xs ${map[status] ?? ""}`}>{status.toUpperCase()}</span>;
}
