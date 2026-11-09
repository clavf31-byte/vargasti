import client from "@/config/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader, EmptyState, LoadingState, Btn } from "@/components/shared";
import { Plus, Eye, Edit2, Trash2, ScrollText } from "lucide-react";

export const Route = createFileRoute("/crm/contratos/")({
  head: () => ({ meta: [{ title: `Contratos · CRM ${client.name}` }] }),
  component: ContratsPage,
});

interface Contrato {
  id: string;
  titulo: string;
  cliente_id: string;
  status: string;
  created_at: string;
  clientes?: { nome: string };
}

function ContratsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);

  const loadContratos = async () => {
    if (!user) return;
    try {
      const { data, error } = await (supabase as any)
        .from("contracts")
        .select("id, titulo, cliente_id, status, created_at, clientes(nome)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setContratos(data || []);
    } catch (e) {
      console.error("Erro:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadContratos(); }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Deletar este contrato?")) return;
    try {
      await (supabase as any).from("contracts").delete().eq("id", id);
      loadContratos();
    } catch (e) {
      alert("Erro: " + (e instanceof Error ? e.message : "Erro desconhecido"));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "rascunho": return "bg-yellow/10 text-yellow border-yellow/30";
      case "enviado": return "bg-blue/10 text-blue border-blue/30";
      case "aprovado": return "bg-green/10 text-green border-green/30";
      case "finalizado": return "bg-select/10 text-select border-select/30";
      default: return "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/30";
    }
  };

  const statusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
        <PageHeader
          category="CRM"
          title="Contratos"
          icon={ScrollText}
          subtitle={`${contratos.length} contrato(s)`}
          actions={
            <Btn variant="primary" onClick={() => navigate({ to: "/crm/contratos/novo" })}>
              <Plus className="size-4" /> Novo Contrato
            </Btn>
          }
        />

        {loading ? (
          <LoadingState />
        ) : contratos.length === 0 ? (
          <EmptyState icon={ScrollText} title="Nenhum contrato criado ainda" />
        ) : (
          <div className="card-graphite overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-left">Título</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-left">Cliente</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-left">Status</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-left">Data</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {contratos.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-surface-2/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{c.titulo}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{c.clientes?.nome || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-1 text-[11px] font-semibold rounded-lg border ${getStatusColor(c.status)}`}>
                        {statusLabel(c.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(c.created_at).toLocaleDateString("pt-BR", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate({ to: `/crm/contratos/${c.id}` })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-select/30 text-select bg-select/10 rounded-lg hover:bg-select/20 transition-colors"
                        >
                          <Eye className="size-3" />
                        </button>
                        <button
                          onClick={() => navigate({ to: `/crm/contratos/${c.id}/editar` })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-blue/30 text-blue bg-blue/10 rounded-lg hover:bg-blue/20 transition-colors"
                        >
                          <Edit2 className="size-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-destructive/30 text-destructive bg-destructive/5 rounded-lg hover:bg-destructive/15 transition-colors"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
