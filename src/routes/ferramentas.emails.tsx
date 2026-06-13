import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/shared";
import { EmailPollingWidget } from "@/components/EmailPollingWidget";
import { Mail } from "lucide-react";

export const Route = createFileRoute("/ferramentas/emails")({
  head: () => ({ meta: [{ title: "E-mails · VargasTI Lab" }] }),
  component: EmailsPage,
});

function EmailsPage() {
  return (
    <AppShell>
      <div className="p-4 md:p-5 space-y-5">
        <PageHeader
          category="Ferramentas"
          title="Gerenciador de E-mails"
          icon={Mail}
          iconClass="text-brand"
          subtitle="Sincronize automaticamente e-mails do Gmail com o Helpdesk Interative."
          actions={
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20">
              <div className="w-2 h-2 bg-brand rounded-full animate-pulse" />
              <span className="text-xs font-medium text-brand">Ativo</span>
            </div>
          }
        />

        <div className="max-w-2xl">
          <div className="bg-surface border border-border rounded-xl p-6">
            <EmailPollingWidget />
          </div>

          {/* Info cards */}
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mt-6">Funcionamento do Agente:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div className="bg-brand/5 border border-brand/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground mb-1">Automático</h3>
              <p className="text-xs text-muted-foreground">
                Verifica Gmail a cada 5 minutos e cria tickets automaticamente no Helpdesk.
              </p>
            </div>
            <div className="bg-brand/5 border border-brand/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground mb-1">Manual</h3>
              <p className="text-xs text-muted-foreground">
                Clique "Verificar Agora" para forçar uma sincronização imediata.
              </p>
            </div>
            <div className="bg-brand/5 border border-brand/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground mb-1">IA Inteligente</h3>
              <p className="text-xs text-muted-foreground">
                Claude analisa cada e-mail para categorizar e priorizar automaticamente.
              </p>
            </div>
            <div className="bg-brand/5 border border-brand/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground mb-1">Zero Config</h3>
              <p className="text-xs text-muted-foreground">
                Após inicial setup do Gmail OAuth, tudo funciona sem intervenção.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
