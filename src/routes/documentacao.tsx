import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { docs } from "@/lib/mockData";
import { Plus, BookOpen, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/documentacao")({
  head: () => ({ meta: [{ title: "Documentação · VargasTI" }] }),
  component: DocsPage,
});

function DocsPage() {
  const categories = Array.from(new Set(docs.map(d => d.category)));

  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-8">
        <PageHeader
          title="Documentação"
          subtitle="Base de conhecimento · Infra · Redes · Segurança · Sistemas · Equipamentos."
          action={
            <button className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-brand/90">
              <Plus className="size-4" /> Nova entrada
            </button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1 bg-surface border border-border rounded-lg p-4">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Categorias</p>
            <ul className="space-y-1">
              {categories.map((c) => (
                <li key={c}>
                  <button className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-foreground/80 hover:bg-white/5 hover:text-foreground">
                    <span>{c}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{docs.filter(d => d.category === c).length}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <div className="lg:col-span-3 space-y-3">
            {docs.map((d) => (
              <article key={d.id} className="bg-surface border border-border rounded-lg p-5 hover:border-brand/30 transition-colors flex items-center gap-4 group cursor-pointer">
                <div className="size-10 rounded-md bg-secondary border border-border grid place-items-center shrink-0">
                  <BookOpen className="size-5 text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-foreground font-medium group-hover:text-brand transition-colors">{d.title}</h3>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest border border-border rounded px-1.5 py-0.5">{d.category}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{d.summary}</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground group-hover:text-brand transition-colors shrink-0" />
              </article>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
