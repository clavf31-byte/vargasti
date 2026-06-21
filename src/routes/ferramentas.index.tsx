import client from "@/config/client";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/shared";
import { FileSpreadsheet, ChevronRight, Bot, Sparkles, Wrench, MessageCircle, Mail } from "lucide-react";

export const Route = createFileRoute("/ferramentas/")({
  head: () => ({ meta: [{ title: `Tools · ${client.name}` }] }),
  component: ToolsPage,
});

const TOOLS = [
  {
    to: "/ferramentas/excel" as const,
    icon: FileSpreadsheet,
    iconClass: "bg-warning/10 border-warning/20 text-warning",
    name: "Editor Inteligente de Excel",
    category: "dados",
    description:
      "Importe, filtre, edite, cruze dados com PROCV e exporte planilhas .xlsx. Inclui agente IA para análise em linguagem natural.",
    badge: "Disponível",
    badgeClass: "bg-brand/10 border-brand/20 text-brand",
    footer: "Inclui Agente IA",
  },
  {
    to: "/ferramentas/whatsapp" as const,
    icon: MessageCircle,
    iconClass: "bg-brand/10 border-brand/20 text-brand",
    name: "Agente WhatsApp",
    category: "comunicação",
    description:
      "Conecte seu WhatsApp via Evolution API. O agente Claude responde mensagens automaticamente e salva conversas como anotações.",
    badge: "Disponível",
    badgeClass: "bg-brand/10 border-brand/20 text-brand",
    footer: "Claude + Evolution API",
  },
  {
    to: "/ferramentas/emails" as const,
    icon: Mail,
    iconClass: "bg-brand/10 border-brand/20 text-brand",
    name: "Gerenciador de E-mails",
    category: "integrações",
    description:
      "Sincronize automaticamente e-mails do Gmail. Claude interpreta e cria tickets no Helpdesk Interative com categorização e priorização.",
    badge: "Disponível",
    badgeClass: "bg-brand/10 border-brand/20 text-brand",
    footer: "Gmail OAuth + Claude + Helpdesk",
  },
];

function ToolsPage() {
  return (
    <AppShell>
      <div className="p-4 md:p-5 space-y-5">
        <PageHeader
          category="Ferramentas"
          title="Utilitários"
          icon={Wrench}
          iconClass="text-warning"
          subtitle="Ferramentas e scripts para produtividade e análise de dados."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {TOOLS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="group bg-surface border border-border rounded-xl p-5 hover:border-border/80 hover:bg-white/5 hover:shadow-[0_0_20px_oklch(0.73_0.21_145/0.06)] transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`size-10 rounded-xl border grid place-items-center ${t.iconClass}`}>
                  <t.icon className="size-5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border uppercase tracking-wide ${t.badgeClass}`}>
                    {t.badge}
                  </span>
                  <ChevronRight className="size-3.5 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
              <h3 className="text-sm font-semibold text-foreground group-hover:text-brand transition-colors mb-1 leading-snug">
                {t.name}
              </h3>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-2.5">{t.category}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{t.description}</p>
              <div className="flex items-center gap-1 mt-4 pt-4 border-t border-border/50">
                <Sparkles className="size-3 text-brand/50" />
                <span className="text-[10px] text-muted-foreground">{t.footer}</span>
              </div>
            </Link>
          ))}

          <div className="bg-surface/50 border border-dashed border-border/50 rounded-xl p-5 flex flex-col items-center justify-center gap-2 min-h-[180px]">
            <div className="size-9 rounded-xl bg-surface-2 border border-border grid place-items-center">
              <Bot className="size-4 text-muted-foreground/40" />
            </div>
            <p className="text-xs text-muted-foreground/60 text-center">
              Mais ferramentas
              <br />
              em breve
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
