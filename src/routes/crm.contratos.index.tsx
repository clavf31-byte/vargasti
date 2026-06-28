import client from "@/config/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader, EmptyState, LoadingState, StatusBadge, Btn } from "@/components/shared";
import { Plus, Eye, Send, FileUp, Trash2, ScrollText, FileEdit, CheckCircle2, Mail } from "lucide-react";

export const Route = createFileRoute("/crm/contratos/")({
  head: () => ({ meta: [{ title: `Contratos · CRM ${client.name}` }] }),
  component: ContratosPage,
});

interface Contrato {
  id: string;
  titulo: string;
  cliente_id: string;
  clientes?: { nome: string };
  status: string;
  email_enviado_em?: string;
  assinado_em?: string;
  created_at: string;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  rascunho: <><FileEdit className="size-3" /> Rascunho</>,
  enviado:  <><Mail className="size-3" /> Enviado</>,
  assinado: <><CheckCircle2 className="size-3" /> Assinado</>,
};

function ContratosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);

  const loadContratos = async () => {
    if (!user) return;
    try {
      const { data, error } = await (supabase as any)
        .from("contracts")
        .select("id, titulo, cliente_id, clientes(nome), status, email_enviado_em, assinado_em, created_at")
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

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadContratos();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Deletar este contrato?")) return;
    try {
      await (supabase as any).from("contracts").delete().eq("id", id);
      loadContratos();
    } catch {
      alert("Erro ao deletar");
    }
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
          <EmptyState icon={ScrollText} title="Nenhum contrato criado" />
        ) : (
          <div className="card-graphite overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-border">
                  {["Título", "Cliente", "Status", "Data", "Ações"].map((h, i) => (
                    <th key={h} className={`px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ${i === 4 ? "text-center" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contratos.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-surface-2/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{c.titulo}</td>
                    <td className="px-4 py-3 text-muted-foreground">{(c.clientes as any)?.nome || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold capitalize">
                        {STATUS_ICON[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => navigate({ to: "/crm/contratos/$id", params: { id: c.id } })}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-select/30 text-select bg-select/10 rounded-lg hover:bg-select/20 transition-colors"
                        >
                          <Eye className="size-3" /> Ver
                        </button>
                        {c.status === "rascunho" && (
                          <button
                            onClick={() => navigate({ to: "/crm/contratos/enviar/$id", params: { id: c.id } })}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-select/30 text-select bg-select/10 rounded-lg hover:bg-select/20 transition-colors"
                          >
                            <Send className="size-3" /> Enviar
                          </button>
                        )}
                        {c.status === "enviado" && (
                          <button
                            onClick={() => navigate({ to: "/crm/contratos/receber/$id", params: { id: c.id } })}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-brand/30 text-brand bg-brand/10 rounded-lg hover:bg-brand/20 transition-colors"
                          >
                            <FileUp className="size-3" /> Receber
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="inline-flex items-center justify-center p-1.5 border border-destructive/30 text-destructive bg-destructive/5 rounded-lg hover:bg-destructive/15 transition-colors"
                        >
                          <Trash2 className="size-3.5" />
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
