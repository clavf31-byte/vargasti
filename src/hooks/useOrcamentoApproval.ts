import { supabase } from "@/integrations/supabase/client";
import { sendApprovalNotification } from "@/lib/api/sendApprovalNotification";

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
    const { data: ok, error } = await supabase
      .rpc("approve_orcamento_by_token", { _token: token });

    if (error) throw error;
    if (!ok) throw new Error("Orçamento não encontrado ou já processado");

    // Buscar dados para notificação
    const orc = await obterOrcamentoPorToken(token);
    if (orc) {
      await sendApprovalNotification({
        data: {
          orcamentoNumero: orc.numero_formatado,
          orcamentoTotal: orc.total,
          clienteNome: orc.cliente?.nome || "Cliente",
          aprovado: true,
        },
      }).catch(() => null);
    }

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

    const { data: ok, error } = await supabase
      .rpc("reject_orcamento_by_token", { _token: token, _motivo: motivo });

    if (error) throw error;
    if (!ok) throw new Error("Orçamento não encontrado ou já processado");

    // Notificação
    const orc = await obterOrcamentoPorToken(token);
    if (orc) {
      await sendApprovalNotification({
        data: {
          orcamentoNumero: orc.numero_formatado,
          orcamentoTotal: orc.total,
          clienteNome: orc.cliente?.nome || "Cliente",
          aprovado: false,
          motivo,
        },
      }).catch(() => null);
    }

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
    const { data: orcamento, error } = await supabase
      .rpc("get_orcamento_by_approval_token", { _token: token })
      .single();

    if (error) throw error;
    if (!orcamento) return null;

    const [{ data: itens }, { data: cliente }] = await Promise.all([
      supabase.rpc("get_orcamento_itens_by_approval_token", { _token: token }),
      supabase.from("clientes").select("id, nome, email, telefone").eq("id", orcamento.cliente_id).single(),
    ]);

    return { ...orcamento, itens: itens || [], cliente: cliente || null };
  } catch (err) {
    return null;
  }
}
