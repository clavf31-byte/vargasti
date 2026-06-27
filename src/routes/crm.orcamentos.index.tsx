import client from "@/config/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { OrcamentoFormInline } from "@/components/crm/OrcamentoFormInline";
import { PageHeader, EmptyState, LoadingState, StatusBadge, Btn } from "@/components/shared";
import { FileSpreadsheet, Search, Filter, Trash2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/crm/orcamentos/")({
  head: () => ({ meta: [{ title: `Orçamentos · CRM ${client.name}` }] }),
  component: OrcamentosPage,
});

const STATUS_FILTER_CLS: Record<string, string> = {
  rascunho:  "text-muted-foreground border-muted-foreground/30",
  enviado:   "text-info border-info/30",
  aprovado:  "text-brand border-brand/30",
  rejeitado: "text-destructive border-destructive/30",
};

function OrcamentosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [filtrados, setFiltrados] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    const [orcRes, clientRes] = await Promise.all([
      supabase.from("orcamentos").select("*").eq("user_id", user.id).order("data_criacao", { ascending: false }),
      supabase.from("clientes").select("id, nome").eq("user_id", user.id),
    ]);
    setOrcamentos(orcRes.data || []);
    setClientes(clientRes.data || []);
    setLoading(false);
  };

  useEffect(() => { if (!user) { setLoading(false); return; } loadData(); }, [user]);

  useEffect(() => {
    let r = orcamentos;
    if (searchTerm) r = r.filter((o) => (o.numero_formatado || o.numero || "").toLowerCase().includes(searchTerm.toLowerCase()));
    if (statusFilter) r = r.filter((o) => (o.status_enum ?? o.status) === statusFilter);
    setFiltrados(r);
  }, [orcamentos, searchTerm, statusFilter]);

  const handleSuccess = () => { loadData(); setIsFormOpen(false); };
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza?")) return;
    await supabase.from("orcamentos").delete().eq("id", id);
    loadData();
  };

  const statuses = ["rascunho", "enviado", "aprovado", "rejeitado"];

  return (
    <AppShell>
      <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
        <PageHeader
          category="CRM"
          title="Orçamentos"
          icon={FileSpreadsheet}
          iconClass="text-info"
          subtitle={`${orcamentos.length} total · ${filtrados.length} exibindo`}
          actions={
            <Btn variant="primary" onClick={() => setIsFormOpen((v) => !v)}>
              {isFormOpen ? "Cancelar" : "+ Novo Orçamento"}
            </Btn>
          }
        />

        {isFormOpen && (
          <OrcamentoFormInline
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSuccess={handleSuccess}
            userId={user!.id}
            clientes={clientes}
          />
        )}

        {!isFormOpen && (
          <>
            <div className="flex gap-3 flex-wrap items-center">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar orçamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-surface/60 border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-select/60 focus:ring-2 focus:ring-select/20 transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-muted-foreground" />
                {statuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                    className={cn(
                      "px-3 py-1 text-xs font-semibold rounded-full border capitalize transition-colors",
                      statusFilter === s
                        ? STATUS_FILTER_CLS[s] + " bg-surface-2"
                        : "text-muted-foreground border-border hover:border-muted-foreground/40"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <LoadingState />
            ) : filtrados.length === 0 ? (
              <EmptyState
                icon={FileSpreadsheet}
                title={orcamentos.length === 0 ? "Nenhum orçamento criado" : "Nenhum orçamento encontrado"}
              />
            ) : (
              <div className="card-graphite overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-border">
                      {["Número", "Status", "Valor", "Data", "Ações"].map((h, i) => (
                        <th key={h} className={`px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ${i === 4 ? "text-center" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((o) => (
                      <tr key={o.id} className="border-b border-border/50 hover:bg-surface-2/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-foreground">{o.numero_formatado || o.numero}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={o.status_enum ?? o.status} />
                        </td>
                        <td className="px-4 py-3 font-semibold text-brand">
                          R$ {(o.total || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(o.data_criacao).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => navigate({ to: "/crm/orcamentos/$id", params: { id: o.id } })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-select/30 text-select bg-select/10 rounded-lg hover:bg-select/20 transition-colors"
                            >
                              <Eye className="size-3" /> Ver
                            </button>
                            <button
                              onClick={() => handleDelete(o.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-destructive/30 text-destructive bg-destructive/5 rounded-lg hover:bg-destructive/15 transition-colors"
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
          </>
        )}
      </div>
    </AppShell>
  );
}
