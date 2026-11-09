import client from "@/config/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader, EmptyState, LoadingState, Btn } from "@/components/shared";
import { Plus, Edit2, Trash2, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/crm/contratos/modelos")({
  head: () => ({ meta: [{ title: `Modelos de Contratos · CRM ${client.name}` }] }),
  component: ModelosPage,
});

interface Template {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  created_at: string;
}

function ModelosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTemplates = async () => {
    if (!user) return;
    try {
      const { data, error } = await (supabase as any)
        .from("contract_templates")
        .select("id, nome, descricao, ativo, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTemplates(data || []);
    } catch (e) {
      console.error("Erro ao carregar modelos:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTemplates(); }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este modelo?")) return;
    try {
      const { error } = await (supabase as any).from("contract_templates").delete().eq("id", id);
      if (error) throw error;
      loadTemplates();
    } catch (e) {
      alert("Erro ao deletar: " + (e instanceof Error ? e.message : "Erro desconhecido"));
    }
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
        <PageHeader
          category="CRM"
          title="Modelos de Contrato"
          icon={ClipboardList}
          subtitle={`${templates.length} modelo(s)`}
          actions={
            <Btn variant=”primary” onClick={() => navigate({ to: “/crm/contratos/modelos/create” })}>
              <Plus className=”size-4” /> Novo Modelo
            </Btn>
          }
        />

        {loading ? (
          <LoadingState />
        ) : templates.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Nenhum modelo criado ainda" />
        ) : (
          <div className="card-graphite overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-left">Nome</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-left">Descrição</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-surface-2/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{t.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{t.descricao || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate({ to: `/crm/contratos/modelos/edit/${t.id}` })}
                          className=”inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-select/30 text-select bg-select/10 rounded-lg hover:bg-select/20 transition-colors”
                        >
                          <Edit2 className="size-3" /> Editar
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-destructive/30 text-destructive bg-destructive/5 rounded-lg hover:bg-destructive/15 transition-colors"
                        >
                          <Trash2 className="size-3" /> Deletar
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

