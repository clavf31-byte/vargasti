import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { ideas } from "@/lib/mockData";
import { Plus, Sparkles } from "lucide-react";

export const Route = createFileRoute("/ideias")({
  head: () => ({ meta: [{ title: "Ideias · VargasTI" }] }),
  component: IdeasPage,
});

const PRIORITY: Record<string, string> = {
  "Alta": "text-destructive border-destructive/30 bg-destructive/10",
  "Média": "text-[color:var(--warning)] border-[color:var(--warning)]/30 bg-[color:var(--warning)]/10",
  "Baixa": "text-[color:var(--info)] border-[color:var(--info)]/30 bg-[color:var(--info)]/10",
};
const STATUS: Record<string, string> = {
  "Planejado": "text-brand border-brand/30 bg-brand/10",
  "Em análise": "text-[color:var(--warning)] border-[color:var(--warning)]/30 bg-[color:var(--warning)]/10",
  "Backlog": "text-muted-foreground border-border bg-secondary",
};

function IdeasPage() {
  const columns = ["Planejado", "Em análise", "Backlog"] as const;
  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-6">
        <PageHeader
          title="Banco de Ideias"
          subtitle="Novos projetos, melhorias e integrações futuras."
          action={
            <button className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-brand/90">
              <Plus className="size-4" /> Nova ideia
            </button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((col) => (
            <section key={col} className="bg-surface border border-border rounded-lg p-4">
              <header className="flex items-center justify-between mb-3 pb-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">{col}</h3>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {ideas.filter(i => i.status === col).length}
                </span>
              </header>
              <div className="space-y-3">
                {ideas.filter(i => i.status === col).map((i) => (
                  <article key={i.id} className="bg-background border border-border rounded-md p-3 hover:border-brand/30 transition-colors">
                    <div className="flex items-start gap-2 mb-2">
                      <Sparkles className="size-3.5 text-brand mt-0.5 shrink-0" />
                      <h4 className="text-sm text-foreground font-medium leading-snug">{i.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{i.description}</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono border ${PRIORITY[i.priority] ?? ""}`}>
                      {i.priority.toUpperCase()}
                    </span>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="text-[10px] font-mono text-muted-foreground text-center">
          {ideas.length} ideias · {ideas.filter(i => i.status !== "Backlog").length} em movimento
        </div>
      </div>
    </AppShell>
  );
}
