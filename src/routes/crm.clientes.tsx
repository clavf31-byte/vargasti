import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Users } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/crm/clientes")({
  head: () => ({ meta: [{ title: "Clientes · CRM VargasTI" }] }),
  component: ClientesPage,
});

type Cliente = {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  cnpj_cpf?: string;
  endereco?: string;
  criado_em: string;
};

function ClientesPage() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadClientes();
  }, [user]);

  async function loadClientes() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("user_id", user!.id)
        .order("criado_em", { ascending: false });

      if (error) throw error;
      setClientes((data as Cliente[]) || []);
    } catch (e) {
      console.error("Erro ao carregar clientes:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
        <PageHeader
          title="Clientes"
          subtitle={`${clientes.length} cliente${clientes.length !== 1 ? "s" : ""} cadastrado${clientes.length !== 1 ? "s" : ""}`}
          action={<button style={{ padding: "8px 16px", background: "#13c8d3", color: "#07111c", border: "none", borderRadius: "6px", cursor: "pointer" }}>+ Novo Cliente</button>}
        />

        {loading ? (
          <p style={{ color: "#8da2b4" }}>Carregando clientes...</p>
        ) : clientes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#8da2b4" }}>
            <Users style={{ width: "48px", height: "48px", opacity: 0.2, margin: "0 auto 1rem" }} />
            <p>Nenhum cliente cadastrado</p>
            <p style={{ fontSize: "12px" }}>Clique em "+ Novo Cliente" para começar</p>
          </div>
        ) : (
          <div style={{
            background: "rgba(6, 34, 53, 0.6)",
            border: "1px solid rgba(19, 200, 211, 0.16)",
            borderRadius: "12px",
            overflow: "hidden",
            marginTop: "2rem"
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "rgba(19, 200, 211, 0.08)", borderBottom: "1px solid rgba(19, 200, 211, 0.16)" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#8da2b4", fontWeight: 600 }}>Nome</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#8da2b4", fontWeight: 600 }}>Email</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#8da2b4", fontWeight: 600 }}>Telefone</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#8da2b4", fontWeight: 600 }}>CPF/CNPJ</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#8da2b4", fontWeight: 600 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id} style={{ borderBottom: "1px solid rgba(19, 200, 211, 0.08)" }}>
                    <td style={{ padding: "12px 16px", color: "#eaf3f8" }}>{cliente.nome}</td>
                    <td style={{ padding: "12px 16px", color: "#8da2b4", fontSize: "13px" }}>{cliente.email || "—"}</td>
                    <td style={{ padding: "12px 16px", color: "#8da2b4", fontSize: "13px" }}>{cliente.telefone || "—"}</td>
                    <td style={{ padding: "12px 16px", color: "#8da2b4", fontSize: "13px" }}>{cliente.cnpj_cpf || "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <button style={{ padding: "4px 8px", fontSize: "12px", background: "rgba(19, 200, 211, 0.1)", border: "1px solid rgba(19, 200, 211, 0.3)", color: "#13c8d3", borderRadius: "4px", cursor: "pointer" }}>Editar</button>
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
