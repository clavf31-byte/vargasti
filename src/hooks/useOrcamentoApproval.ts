import { supabase } from "@/integrations/supabase/client";

interface ApprovalResult {
  token: string;
  approval_url: string;
  success: boolean;
  error?: string;
}

export async function gerarLinkAprovacao(
  orcamentoId: string
): Promise<ApprovalResult> {
  try {
    // Gerar token localmente
    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");

    // Salvar no banco
    const { error: updateError } = await supabase
      .from("orcamentos")
      .update({
        approval_token: token,
        approval_status: "pending",
      })
      .eq("id", orcamentoId);

    if (updateError) throw updateError;

    // Gerar URL
    const baseUrl = (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, "") || window.location.origin;
    const approvalUrl = `${baseUrl}/orcamento/approve/${token}`;

    return {
      token,
      approval_url: approvalUrl,
      success: true,
    };
  } catch (err) {
    return {
      token: "",
      approval_url: "",
      success: false,
      error: err instanceof Error ? err.message : "Erro ao gerar link",
    };
  }
}

export async function aprovarOrcamento(
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const agora = new Date().toISOString();

    const { error } = await supabase
      .from("orcamentos")
      .update({
        approval_status: "approved",
        status_enum: "aprovado",
        approved_at: agora,
      })
      .eq("approval_token", token)
      .eq("approval_status", "pending");

    if (error) throw error;

    // Registrar no histórico
    await supabase.from("orcamento_status_history").insert([
      {
        orcamento_id: token,
        status_anterior: "enviado",
        status_novo: "aprovado",
        motivo: "Aprovado via link público",
        data_alteracao: agora,
      },
    ]);

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao aprovar",
    };
  }
}

export async function rejeitarOrcamento(
  token: string,
  motivo: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const agora = new Date().toISOString();

    const { error } = await supabase
      .from("orcamentos")
      .update({
        approval_status: "rejected",
        status_enum: "rejeitado",
        rejected_at: agora,
        motivo_rejeicao: motivo,
      })
      .eq("approval_token", token)
      .eq("approval_status", "pending");

    if (error) throw error;

    // Registrar no histórico
    await supabase.from("orcamento_status_history").insert([
      {
        orcamento_id: token,
        status_anterior: "enviado",
        status_novo: "rejeitado",
        motivo: `Rejeitado: ${motivo}`,
        data_alteracao: agora,
      },
    ]);

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao rejeitar",
    };
  }
}

export async function obterOrcamentoPorToken(
  token: string
): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from("orcamentos")
      .select(
        `
        *,
        cliente:cliente_id (id, nome, email, telefone, endereco),
        itens:orcamento_itens (*)
      `
      )
      .eq("approval_token", token)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    return null;
  }
}
