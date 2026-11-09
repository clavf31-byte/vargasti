import client from "@/config/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader, LoadingState, Btn } from "@/components/shared";
import { ChevronLeft, ScrollText } from "lucide-react";

export const Route = createFileRoute("/crm/contratos/$id")({
  head: () => ({ meta: [{ title: `Contrato · CRM ${client.name}` }] }),
  component: VisualizarContratoPage,
});

interface Contrato {
  id: string;
  titulo: string;
  conteudo: string;
  status: string;
  created_at: string;
}

function VisualizarContratoPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContrato();
  }, [id, user]);

  const loadContrato = async () => {
    if (!user || !id) return;
    try {
      const { data, error } = await (supabase as any)
        .from("contracts")
        .select("id, titulo, conteudo, status, created_at")
        .eq("id", id)
        .single();
      if (error) throw error;
      setContrato(data);
    } catch (e) {
      console.error("Erro:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="p-6">
          <LoadingState />
        </div>
      </AppShell>
    );
  }

  if (!contrato) {
    return (
      <AppShell>
        <div className="p-6 text-center text-muted-foreground">
          Contrato não encontrado
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
        <PageHeader
          category="CRM"
          title={contrato.titulo}
          icon={ScrollText}
          subtitle={contrato.status}
          actions={
            <Btn variant="secondary" onClick={() => navigate({ to: "/crm/contratos" })}>
              <ChevronLeft className="size-4" /> Voltar
            </Btn>
          }
        />

        <div className="card-graphite p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Status</span>
              <p className="font-semibold text-foreground mt-1">{contrato.status}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Data de Criação</span>
              <p className="font-semibold text-foreground mt-1">
                {new Date(contrato.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <p className="text-xs text-muted-foreground mb-3">Conteúdo do Contrato</p>
            <div className="bg-surface rounded-lg p-4 text-sm text-foreground font-mono whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
              {contrato.conteudo}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={() => navigate({ to: `/crm/contratos/${id}/editar` })}
              className="px-4 py-2.5 bg-blue text-white text-sm font-semibold rounded-lg hover:bg-blue/90 transition-colors"
            >
              ✏️ Editar
            </button>
            <button
              onClick={() => navigate({ to: "/crm/contratos" })}
              className="px-4 py-2.5 border border-border text-sm text-foreground rounded-lg hover:bg-surface-2 transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
