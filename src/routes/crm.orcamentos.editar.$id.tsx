import client from "@/config/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { OrcamentoFormInline } from "@/components/crm/OrcamentoFormInline";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/crm/orcamentos/editar/$id")({
  head: () => ({ meta: [{ title: `Editar Orçamento · CRM ${client.name}` }] }),
  component: EditarOrcamentoPage,
});

function EditarOrcamentoPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const [clientes, setClientes] = useState<Array<{ id: string; nome: string }>>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("clientes")
      .select("id, nome")
      .eq("user_id", user.id)
      .order("nome")
      .then(({ data }) => setClientes(data || []));
  }, [user]);

  const voltar = () => navigate({ to: `/crm/orcamentos/${id}` });

  return (
    <AppShell>
      <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
        <button
          onClick={voltar}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-select hover:text-select/80 transition-colors"
        >
          <ChevronLeft className="size-4" /> Voltar
        </button>
        {user && (
          <OrcamentoFormInline
            userId={user.id}
            clientes={clientes}
            orcamentoId={id}
            isOpen
            onClose={voltar}
            onSuccess={() => {}}
          />
        )}
      </div>
    </AppShell>
  );
}
