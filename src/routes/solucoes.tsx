import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { solutions } from "@/lib/mockData";
import { Plus, FileText } from "lucide-react";

export const Route = createFileRoute("/solucoes")({
  head: () => ({ meta: [{ title: "Soluções · VargasTI" }] }),
  component: SolucoesPage,
});

const CATEGORY_COLORS: Record<string, string> = {
  "Procedimento": "text-brand border-brand/30 bg-brand/10",
  "Tutorial": "text-[color:var(--info)] border-[color:var(--info)]/30 bg-[color:var(--info)]/10",
  "Correção": "text-destructive border-destructive/30 bg-destructive/10",
  "Caso de Sucesso": "text-[color:var(--warning)] border-[color:var(--warning)]/30 bg-[color:var(--warning)]/10",
};

function SolucoesPage() {
  return (
    <AppShell>
      <div className="p-6 md:p-8">
        <PageHeader
          title="Soluções"
          subtitle="Procedimentos, tutoriais, correções e casos de sucesso."
          action={
            <button className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-brand/90">
              <Plus className="size-4" /> Nova solução
            </button>
          }
        />

        <div className="bg-surface border border-border rounded-lg divide-y divide-border">
          {solutions.map((s) => (
            <article key={s.id} className="p-5 hover:bg-white/5 transition-colors flex gap-4">
              <div className="size-10 rounded-md bg-secondary border border-border grid place-items-center shrink-0">
                <FileText className="size-5 text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-foreground font-medium truncate">{s.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${CATEGORY_COLORS[s.category] ?? ""}`}>
                    {s.category.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{s.summary}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {s.tags.map((t) => (
                    <span key={t} className="px-1.5 py-0.5 rounded bg-secondary text-muted-foreground text-[10px] font-mono">#{t}</span>
                  ))}
                  <span className="ml-auto text-[10px] font-mono text-muted-foreground">{s.updatedAt}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
