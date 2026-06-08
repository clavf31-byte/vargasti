import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { scripts } from "@/lib/mockData";
import { Plus, Copy } from "lucide-react";

export const Route = createFileRoute("/scripts")({
  head: () => ({ meta: [{ title: "Scripts · VargasTI" }] }),
  component: ScriptsPage,
});

const LANG_COLORS: Record<string, string> = {
  PowerShell: "text-[color:var(--info)] border-[color:var(--info)]/30",
  Bash: "text-brand border-brand/30",
  SQL: "text-[color:var(--warning)] border-[color:var(--warning)]/30",
  Python: "text-[color:var(--info)] border-[color:var(--info)]/30",
  JavaScript: "text-[color:var(--warning)] border-[color:var(--warning)]/30",
};

function ScriptsPage() {
  const [filter, setFilter] = useState<string>("Todos");
  const langs = ["Todos", ...Array.from(new Set(scripts.map(s => s.language)))];
  const filtered = filter === "Todos" ? scripts : scripts.filter(s => s.language === filter);

  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-6">
        <PageHeader
          title="Scripts"
          subtitle="Biblioteca pessoal · SQL · PowerShell · Bash · JavaScript · Python."
          action={
            <button className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-brand/90">
              <Plus className="size-4" /> Novo script
            </button>
          }
        />

        <div className="flex flex-wrap gap-2">
          {langs.map((l) => (
            <button
              key={l}
              onClick={() => setFilter(l)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-colors ${
                filter === l
                  ? "bg-brand/10 text-brand border-brand/30"
                  : "bg-surface text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map((s) => (
            <article key={s.id} className="bg-surface border border-border rounded-lg overflow-hidden">
              <header className="flex items-center justify-between px-5 py-3 border-b border-border bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <h3 className="font-mono text-sm text-foreground">{s.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${LANG_COLORS[s.language] ?? ""}`}>
                    {s.language.toUpperCase()}
                  </span>
                </div>
                <button className="text-muted-foreground hover:text-brand p-1" aria-label="Copiar">
                  <Copy className="size-4" />
                </button>
              </header>
              <p className="px-5 py-3 text-xs text-muted-foreground border-b border-border">{s.description}</p>
              <pre className="px-5 py-4 font-mono text-xs leading-relaxed text-foreground overflow-x-auto bg-background/40">
                <code>{s.code}</code>
              </pre>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
