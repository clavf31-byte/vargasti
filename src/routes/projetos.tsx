import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { projects } from "@/lib/mockData";
import { StatusBadge } from "./index";
import { Plus, Paperclip, Link as LinkIcon } from "lucide-react";

export const Route = createFileRoute("/projetos")({
  head: () => ({ meta: [{ title: "Projetos · VargasTI" }] }),
  component: ProjetosPage,
});

function ProjetosPage() {
  return (
    <AppShell>
      <div className="p-6 md:p-8">
        <PageHeader
          title="Projetos"
          subtitle="Cadastro, evolução e acompanhamento dos projetos."
          action={
            <button className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-brand/90 transition-colors">
              <Plus className="size-4" /> Novo projeto
            </button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p) => (
            <article key={p.id} className="group bg-surface border border-border p-5 rounded-lg hover:border-brand/30 transition-all">
              <div className="flex justify-between items-start mb-3">
                <StatusBadge status={p.status} />
                <span className="text-[10px] font-mono text-muted-foreground">{p.version}</span>
              </div>
              <h3 className="text-foreground font-semibold mb-1 group-hover:text-brand transition-colors">{p.name}</h3>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">{p.category}</p>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{p.description}</p>

              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Objetivo</p>
                  <p className="text-xs text-foreground">{p.goal}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p.tech.map((t) => (
                    <span key={t} className="px-1.5 py-0.5 rounded bg-secondary text-muted-foreground text-[10px] font-mono">{t}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border text-[10px] font-mono text-muted-foreground">
                  <span>atualizado: {p.updatedAt}</span>
                  <div className="flex items-center gap-2">
                    <Paperclip className="size-3" />
                    <LinkIcon className="size-3" />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
