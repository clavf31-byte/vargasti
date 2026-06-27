import client from "@/config/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Users, Search, Trash2, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { ClienteFormInline } from "@/components/crm/ClienteFormInline";
import { PageHeader, EmptyState, LoadingState, Btn } from "@/components/shared";

export const Route = createFileRoute("/crm/clientes/")({
  head: () => ({ meta: [{ title: `Clientes · CRM ${client.name}` }] }),
  component: ClientesPage,
});

type Cliente = {
  id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  cnpj_cpf?: string | null;
  created_at: string;
};

function ClientesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtrados, setFiltrados] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const loadClientes = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("clientes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setClientes((data as Cliente[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadClientes();
  }, [user]);

  useEffect(() => {
    let r = clientes;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      r = r.filter((c) =>
        c.nome.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.cnpj_cpf?.includes(searchTerm)
      );
    }
    setFiltrados(r);
  }, [clientes, searchTerm]);

  const handleSuccess = () => { loadClientes(); setIsFormOpen(false); };
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este cliente?")) return;
    await supabase.from("clientes").delete().eq("id", id);
    loadClientes();
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
        <PageHeader
          category="CRM"
          title="Clientes"
          icon={Users}
          subtitle={`${clientes.length} total · ${filtrados.length} exibindo`}
          actions={
            <Btn variant="primary" onClick={() => setIsFormOpen((v) => !v)}>
              {isFormOpen ? "Cancelar" : "+ Novo Cliente"}
            </Btn>
          }
        />

        {isFormOpen && (
          <ClienteFormInline
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSuccess={handleSuccess}
            userId={user!.id}
          />
        )}

        {!isFormOpen && (
          <>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou CPF/CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface/60 border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-select/60 focus:ring-2 focus:ring-select/20 transition-all"
              />
            </div>

            {loading ? (
              <LoadingState />
            ) : filtrados.length === 0 ? (
              <EmptyState
                icon={Users}
                title={clientes.length === 0 ? "Nenhum cliente cadastrado" : "Nenhum cliente encontrado"}
                subtitle={clientes.length === 0 ? "Crie seu primeiro cliente clicando em + Novo Cliente." : "Tente ajustar o filtro de busca."}
              />
            ) : (
              <div className="card-graphite overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-border">
                      {["Nome", "Email", "Telefone", "CPF/CNPJ", "Ações"].map((h, i) => (
                        <th key={h} className={`px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ${i === 4 ? "text-center" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((c) => (
                      <tr key={c.id} className="border-b border-border/50 hover:bg-surface-2/40 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{c.nome}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.email || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.telefone || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.cnpj_cpf || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => navigate({ to: "/crm/clientes/$id", params: { id: c.id } })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-select/30 text-select bg-select/10 rounded-lg hover:bg-select/20 transition-colors"
                            >
                              <Eye className="size-3" /> Editar
                            </button>
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-destructive/30 text-destructive bg-destructive/5 rounded-lg hover:bg-destructive/15 transition-colors"
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
          </>
        )}
      </div>
    </AppShell>
  );
}
