import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AtendimentoStatus = "rascunho" | "pendente" | "confirmado" | "em andamento" | "concluído" | "cancelado";

export function useAtendimentoWorkflow() {
  const { user } = useAuth();
  const db = supabase as any;

  /**
   * Criar atendimento a partir de email (sem número)
   */
  const createFromEmail = async (data: {
    titulo: string;
    descricao: string;
    cliente_id: string | null;
  }) => {
    if (!user?.id) throw new Error("User not authenticated");

    const { data: created, error } = await db
      .from("atendimentos")
      .insert({
        user_id: user.id,
        status: "rascunho", // Começa como rascunho
        numero: null, // Sem número ainda
        criado_via_email: true,
        ...data,
        data_inicio: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return created;
  };

  /**
   * Criar atendimento manual (imediato com número)
   */
  const createManual = async (data: {
    titulo: string;
    descricao: string;
    cliente_id: string | null;
    status?: AtendimentoStatus;
  }) => {
    if (!user?.id) throw new Error("User not authenticated");

    // Status padrão é "pendente" (vai alocar número automaticamente)
    const status = data.status || "pendente";

    const { data: created, error } = await db
      .from("atendimentos")
      .insert({
        user_id: user.id,
        status,
        numero: null, // Será alocado automaticamente se não for rascunho
        criado_via_email: false,
        ...data,
        data_inicio: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return created;
  };

  /**
   * Aprovar rascunho (muda para pendente e aloca número)
   */
  const approveDraft = async (id: string) => {
    const { data, error } = await db
      .from("atendimentos")
      .update({ status: "pendente" }) // Trigger aloca número automaticamente
      .eq("id", id)
      .eq("user_id", user?.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  /**
   * Deletar rascunho (sem gastar número)
   */
  const discardDraft = async (id: string) => {
    const { error } = await db
      .from("atendimentos")
      .delete()
      .eq("id", id)
      .eq("user_id", user?.id)
      .eq("status", "rascunho");

    if (error) throw error;
  };

  /**
   * Mudar status (e alocar número se necessário)
   */
  const updateStatus = async (id: string, newStatus: AtendimentoStatus) => {
    const { data, error } = await db
      .from("atendimentos")
      .update({ status: newStatus })
      .eq("id", id)
      .eq("user_id", user?.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  return {
    createFromEmail,
    createManual,
    approveDraft,
    discardDraft,
    updateStatus,
  };
}
