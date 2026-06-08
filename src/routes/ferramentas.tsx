import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { FileSpreadsheet, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/ferramentas")({
  head: () => ({ meta: [{ title: "Tools · VargasTI Lab" }] }),
  component: ToolsPage,
});

const TOOLS = [
  {
    to: "/ferramentas/excel" as const,
    icon: FileSpreadsheet,
    name: "Excel Treatment",
    category: "dados",
    description: "Importe, edite, filtre e exporte planilhas .xlsx/.csv com controle de colunas.",
  },
];

function ToolsPage() {
  return (
    <AppShell>
      <div className="p-4 md:p-5 space-y-4">
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">Tools</div>
          <h1 className="text-sm text-foreground">Utilitários</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {TOOLS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="group bg-surface border border-border rounded p-4 hover:border-brand/30 hover:bg-brand/5 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="size-9 rounded bg-brand/10 border border-brand/20 grid place-items-center">
                  <t.icon className="size-4 text-brand" />
                </div>
                <ChevronRight className="size-3 text-muted-foreground group-hover:text-brand transition-colors mt-1" />
              </div>
              <h3 className="text-xs text-foreground group-hover:text-brand transition-colors mb-0.5">
                {t.name}
              </h3>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-2">
                {t.category}
              </p>
              <p className="text-[10px] text-muted-foreground">{t.description}</p>
            </Link>
          ))}

          <div className="bg-surface border border-dashed border-border rounded p-4 flex items-center justify-center">
            <p className="text-[10px] text-muted-foreground">mais ferramentas em breve</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
