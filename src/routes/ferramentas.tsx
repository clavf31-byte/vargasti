import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { FileSpreadsheet, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/ferramentas")({
  head: () => ({ meta: [{ title: "Ferramentas · VargasTI" }] }),
  component: ToolsPage,
});

const TOOLS = [
  {
    to: "/ferramentas/excel" as const,
    icon: FileSpreadsheet,
    name: "Excel Import / Export",
    category: "Dados",
    description:
      "Importe planilhas .xlsx ou .csv, visualize os dados em tabela e exporte no formato desejado.",
  },
];

function ToolsPage() {
  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-6">
        <PageHeader
          title="Ferramentas"
          subtitle="Utilitários e mini-apps do workspace."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="group bg-surface border border-border rounded-xl p-5 hover:border-brand/30 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="size-11 rounded-lg bg-brand/10 border border-brand/20 grid place-items-center">
                  <t.icon className="size-5 text-brand" />
                </div>
                <ChevronRight className="size-4 text-muted-foreground group-hover:text-brand transition-colors mt-1" />
              </div>
              <h3 className="text-foreground font-medium group-hover:text-brand transition-colors mb-1">
                {t.name}
              </h3>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">
                {t.category}
              </p>
              <p className="text-sm text-muted-foreground">{t.description}</p>
            </Link>
          ))}

          <div className="bg-surface border border-dashed border-border rounded-xl p-5 flex items-center justify-center">
            <p className="text-xs text-muted-foreground font-mono">
              mais ferramentas em breve
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
