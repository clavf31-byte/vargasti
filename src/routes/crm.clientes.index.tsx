import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { ClienteFormInline } from "@/components/crm/ClienteFormInline";
import { PageHeader, Card, Button } from "@/components/ui";
import { colors, spacing, borderRadius } from "@/lib/colors";
import { Search, Trash2, Eye } from "lucide-react";

export const Route = createFileRoute("/crm/clientes/")({
  head: () => ({ meta: [{ title: "Clientes · CRM VargasTI" }] }),
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
    try {
      const { data } = await supabase
        .from("clientes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setClientes((data as Cliente[]) || []);
    } catch (e) {
      console.error("Erro:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadClientes();
  }, [user]);

  useEffect(() => {
    let resultado = clientes;
    if (searchTerm) {
      resultado = resultado.filter(
        (c) =>
          c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.cnpj_cpf?.includes(searchTerm)
      );
    }
    setFiltrados(resultado);
  }, [clientes, searchTerm]);

  const handleSuccess = () => { loadClientes(); setIsFormOpen(false); };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este cliente?")) return;
    try {
      await supabase.from("clientes").delete().eq("id", id);
      loadClientes();
    } catch (e) {
      alert("Erro ao deletar cliente");
    }
  };

  return (
    <AppShell>
      <div style={{ padding: spacing.xl, maxWidth: "1600px", margin: "0 auto" }}>
        <PageHeader
          title="Clientes"
          subtitle={`${clientes.length} total • ${filtrados.length} exibindo`}
          action={
            <Button variant="primary" onClick={() => setIsFormOpen(!isFormOpen)}>
              {isFormOpen ? "Cancelar" : "+ Novo Cliente"}
            </Button>
          }
          icon={<Users size={32} />}
        />

        {isFormOpen && (
          <>
            <ClienteFormInline isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSuccess={handleSuccess} userId={user!.id} />
            <div style={{ marginBottom: spacing.xl }} />
          </>
        )}

        {!isFormOpen && (
          <Card>
            <div style={{ position: "relative" }}>
              <Search size={18} style={{ position: "absolute", left: spacing.md, top: "50%", transform: "translateY(-50%)", color: colors.textSecondary }} />
              <input
                type="text"
                placeholder="Buscar por nome, email ou CPF/CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "100%", padding: `${spacing.sm} ${spacing.md} ${spacing.sm} 40px`, background: colors.background, border: `1px solid ${colors.border}`, borderRadius: borderRadius.md, color: colors.text, fontSize: "14px" }}
              />
            </div>
          </Card>
        )}

        {loading ? (
          <p style={{ color: colors.textSecondary }}>Carregando...</p>
        ) : filtrados.length === 0 && !isFormOpen ? (
          <Card>
            <p style={{ color: colors.textSecondary, margin: 0, textAlign: "center" }}>
              {clientes.length === 0 ? "Nenhum cliente cadastrado" : "Nenhum cliente encontrado"}
            </p>
          </Card>
        ) : !isFormOpen ? (
          <Card>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                    {["Nome", "Email", "Telefone", "CPF/CNPJ", "Ações"].map((h, i) => (
                      <th key={h} style={{ padding: spacing.md, textAlign: i === 4 ? "center" : "left", color: colors.textSecondary, fontWeight: 600, fontSize: "12px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((cliente) => (
                    <tr key={cliente.id} style={{ borderBottom: `1px solid ${colors.borderLight}`, transition: "background 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.background = colors.backgroundTertiary; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                      <td style={{ padding: spacing.md, color: colors.text, fontWeight: 500 }}>{cliente.nome}</td>
                      <td style={{ padding: spacing.md, color: colors.textSecondary }}>{cliente.email || "—"}</td>
                      <td style={{ padding: spacing.md, color: colors.textSecondary }}>{cliente.telefone || "—"}</td>
                      <td style={{ padding: spacing.md, color: colors.textSecondary }}>{cliente.cnpj_cpf || "—"}</td>
                      <td style={{ padding: spacing.md, textAlign: "center", display: "flex", gap: spacing.sm, justifyContent: "center" }}>
                        <button onClick={() => navigate({ to: "/crm/clientes/$id", params: { id: cliente.id } })} style={{ background: colors.background, border: `1px solid ${colors.border}`, color: colors.primary, padding: `${spacing.sm} ${spacing.md}`, borderRadius: borderRadius.sm, cursor: "pointer", fontSize: "12px", display: "flex", gap: "4px", alignItems: "center" }}>
                          <Eye size={14} /> Editar
                        </button>
                        <button onClick={() => handleDelete(cliente.id)} style={{ background: colors.background, border: `1px solid ${colors.error}`, color: colors.error, padding: `${spacing.sm} ${spacing.md}`, borderRadius: borderRadius.sm, cursor: "pointer", fontSize: "12px", display: "flex", gap: "4px", alignItems: "center" }}>
                          <Trash2 size={14} /> Deletar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
