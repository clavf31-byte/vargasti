import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { tools } from "@/lib/mockData";
import { Plus, Star, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/ferramentas")({
  head: () => ({ meta: [{ title: "Ferramentas · VargasTI" }] }),
  component: ToolsPage,
});

function ToolsPage() {
  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-6">
        <PageHeader
          title="Ferramentas"
          subtitle="Stack pessoal de ferramentas, links úteis e favoritos."
          action={
            <button className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-brand/90">
              <Plus className="size-4" /> Nova ferramenta
            </button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((t) => (
            <a
              href={t.url}
              key={t.id}
              target="_blank"
              rel="noreferrer"
              className="group bg-surface border border-border rounded-lg p-5 hover:border-brand/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="size-10 rounded-md bg-secondary border border-border grid place-items-center font-mono font-bold text-brand">
                  {t.name[0]}
                </div>
                <div className="flex items-center gap-2">
                  {t.favorite && <Star className="size-4 fill-brand text-brand" />}
                  <ExternalLink className="size-4 text-muted-foreground group-hover:text-brand transition-colors" />
                </div>
              </div>
              <h3 className="text-foreground font-medium group-hover:text-brand transition-colors">{t.name}</h3>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">{t.category}</p>
              <p className="text-sm text-muted-foreground">{t.description}</p>
            </a>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
