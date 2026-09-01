import { supabase } from "@/integrations/supabase/client";
import { sendApprovalNotification } from "@/lib/api/sendApprovalNotification";

interface ApprovalResult {
  token: string;
  approval_url: string;
  success: boolean;
  error?: string;
}

function montarUrlAprovacao(token: string): string {
  const baseUrl = (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, "") || window.location.origin;
  return `${baseUrl}/orcamento/approve/${token}`;
}

export async function gerarLinkAprovacao(
  orcamentoId: string,
  opts: { forceNew?: boolean } = {}
): Promise<ApprovalResult> {
  try {
    // Reusa o token atual se ainda estiver pendente — assim links já
    // compartilhados continuam válidos a cada novo "Compartilhar".
    if (!opts.forceNew) {
      const { data: atual } = await supabase
        .from("orcamentos")
        .select("approval_token, approval_status")
        .eq("id", orcamentoId)
        .maybeSingle();

      if (atual?.approval_token && atual.approval_status === "pending") {
        return {
          token: atual.approval_token,
          approval_url: montarUrlAprovacao(atual.approval_token),
          success: true,
        };
      }
    }

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

    return {
      token,
      approval_url: montarUrlAprovacao(token),
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

    if (error) throw new Error(error.message || JSON.stringify(error));
    if (!ok) throw new Error("Orçamento não encontrado ou já processado");

    // Notificação + pagamento pendente — fire-and-forget
    obterOrcamentoPorToken(token).then(async (orc) => {
      if (!orc) return;
      sendApprovalNotification({
        data: {
          orcamentoNumero: orc.numero_formatado,
          orcamentoTotal: orc.total,
          clienteNome: orc.cliente?.nome || "Cliente",
          aprovado: true,
        },
      }).catch(() => {});

      // Cria pagamento pendente se ainda não existe
      try {
        const { data: existing } = await supabase
          .from("pagamentos")
          .select("id")
          .eq("orcamento_id", orc.id)
          .maybeSingle();
        if (!existing) {
          await supabase.from("pagamentos").insert({
            orcamento_id: orc.id,
            user_id: orc.user_id,
            valor: orc.total,
            status: "pendente",
            data_pagamento: new Date().toISOString().split("T")[0],
            referencia: orc.numero_formatado,
          });
        }
      } catch (_) {}
    }).catch(() => {});

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

    if (error) throw new Error(error.message || JSON.stringify(error));
    if (!ok) throw new Error("Orçamento não encontrado ou já processado");

    // Notificação fire-and-forget
    obterOrcamentoPorToken(token).then((orc) => {
      if (!orc) return;
      sendApprovalNotification({
        data: {
          orcamentoNumero: orc.numero_formatado,
          orcamentoTotal: orc.total,
          clienteNome: orc.cliente?.nome || "Cliente",
          aprovado: false,
          motivo,
        },
      }).catch(() => {});
    }).catch(() => {});

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

    const { data: itens } = await supabase
      .rpc("get_orcamento_itens_by_approval_token", { _token: token });

    return {
      ...orcamento,
      itens: itens || [],
      cliente: { nome: orcamento.cliente_nome },
    };
  } catch (err) {
    return null;
  }
}
