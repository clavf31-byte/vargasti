import { createFileRoute } from "@tanstack/react-router";
import { ClienteForm } from "@/components/crm/ClienteForm";
import { Users } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/crm/clientes")({
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
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: clientes = [], isLoading, refetch } = useQuery({
    queryKey: ["clientes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as Cliente[]) || [];
    },
    enabled: !!user,
  });

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ margin: "0 0 0.5rem 0", color: "#eaf3f8", fontSize: "32px" }}>Clientes</h1>
          <p style={{ margin: 0, color: "#8da2b4", fontSize: "14px" }}>
            {clientes.length} cliente{clientes.length !== 1 ? "s" : ""} cadastrado{clientes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          style={{
            padding: "10px 20px",
            background: "#13c8d3",
            color: "#061b2a",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          + Novo Cliente
        </button>
      </div>

      <ClienteForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => {
          refetch();
          setIsFormOpen(false);
        }}
        userId={user!.id}
      />

      {isLoading ? (
        <p style={{ color: "#8da2b4" }}>Carregando clientes...</p>
      ) : clientes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#8da2b4" }}>
          <Users style={{ width: "48px", height: "48px", opacity: 0.2, margin: "0 auto 1rem" }} />
          <p>Nenhum cliente cadastrado</p>
          <p style={{ fontSize: "12px" }}>Clique em "+ Novo Cliente" para começar</p>
        </div>
      ) : (
        <div
          style={{
            background: "rgba(6, 34, 53, 0.6)",
            border: "1px solid rgba(19, 200, 211, 0.16)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "rgba(19, 200, 211, 0.08)", borderBottom: "1px solid rgba(19, 200, 211, 0.16)" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#8da2b4", fontWeight: 600 }}>
                  Nome
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#8da2b4", fontWeight: 600 }}>
                  Email
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#8da2b4", fontWeight: 600 }}>
                  Telefone
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#8da2b4", fontWeight: 600 }}>
                  CPF/CNPJ
                </th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id} style={{ borderBottom: "1px solid rgba(19, 200, 211, 0.08)" }}>
                  <td style={{ padding: "12px 16px", color: "#eaf3f8" }}>{cliente.nome}</td>
                  <td style={{ padding: "12px 16px", color: "#8da2b4", fontSize: "13px" }}>{cliente.email || "—"}</td>
                  <td style={{ padding: "12px 16px", color: "#8da2b4", fontSize: "13px" }}>{cliente.telefone || "—"}</td>
                  <td style={{ padding: "12px 16px", color: "#8da2b4", fontSize: "13px" }}>{cliente.cnpj_cpf || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
