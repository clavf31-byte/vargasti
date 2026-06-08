import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { labTests } from "@/lib/mockData";
import { TestStatusBadge } from "./index";
import { Plus, FlaskConical } from "lucide-react";

export const Route = createFileRoute("/laboratorio")({
  head: () => ({ meta: [{ title: "Laboratório · VargasTI" }] }),
  component: LabPage,
});

function LabPage() {
  const running = labTests.filter(t => t.status === "running").length;
  const completed = labTests.filter(t => t.status === "completed").length;
  const failed = labTests.filter(t => t.status === "failed").length;

  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-8">
        <PageHeader
          title="Laboratório"
          subtitle="Testes de IA, sistemas, automações e integrações."
          action={
            <button className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-brand/90">
              <Plus className="size-4" /> Novo teste
            </button>
          }
        />

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Em execução", value: running, color: "text-[color:var(--warning)]" },
            { label: "Concluídos", value: completed, color: "text-brand" },
            { label: "Falhas", value: failed, color: "text-destructive" },
          ].map((s) => (
            <div key={s.label} className="bg-surface border border-border p-5 rounded-lg">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">{s.label}</p>
              <p className={`text-3xl font-bold font-mono ${s.color}`}>{String(s.value).padStart(2, "0")}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {labTests.map((t) => (
            <article key={t.id} className="bg-surface border border-border p-5 rounded-lg hover:border-brand/30 transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <FlaskConical className="size-4 text-brand" />
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{t.category}</span>
                </div>
                <TestStatusBadge status={t.status} />
              </div>
              <h3 className="text-foreground font-medium mb-2">{t.name}</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Ambiente</span><span className="font-mono">{t.environment}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Resultado</span><span className="font-mono text-brand">{t.result}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Atualizado</span><span className="font-mono text-muted-foreground">{t.updatedAt}</span></div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
