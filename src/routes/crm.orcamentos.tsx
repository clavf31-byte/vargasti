import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/crm/orcamentos")({
  head: () => ({ meta: [{ title: "Orçamentos · CRM VargasTI" }] }),
  component: OrcamentosPage,
});

function OrcamentosPage() {
  const { user } = useAuth();
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadOrcamentos = async () => {
      try {
        const { data } = await supabase
          .from("orcamentos")
          .select("*")
          .eq("user_id", user.id);

        setOrcamentos(data || []);
      } catch (e) {
        console.error("Erro:", e);
      } finally {
        setLoading(false);
      }
    };

    loadOrcamentos();
  }, [user]);

  return (
    <div style={{ padding: "2rem", color: "#eaf3f8" }}>
      <h1>Orçamentos</h1>
      {loading && <p>Carregando...</p>}
      {!loading && orcamentos.length === 0 && <p>Nenhum orçamento</p>}
      {!loading && orcamentos.length > 0 && (
        <p>Total: {orcamentos.length} orçamento(s)</p>
      )}
    </div>
  );
}
