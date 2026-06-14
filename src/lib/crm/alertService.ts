import { supabase } from "@/integrations/supabase/client";

export async function verificarOrcamentosVencidos() {
  try {
    const agora = new Date().toISOString();

    const { data: orcamentosVencidos, error: selectError } = await supabase
      .from("orcamentos")
      .select("id, numero, cliente_id, total, data_vencimento")
      .lt("data_vencimento", agora)
      .eq("status", "enviado")
      .eq("alerta_enviado", false);

    if (selectError) throw selectError;

    if (!orcamentosVencidos || orcamentosVencidos.length === 0) {
      return { success: true, count: 0 };
    }

    for (const orc of orcamentosVencidos) {
      await adicionarAlerta({
        orcamento_id: orc.id,
        tipo: "vencimento",
        mensagem: `Orçamento ${orc.numero} venceu em ${new Date(orc.data_vencimento).toLocaleDateString("pt-BR")}`,
        severidade: "warning",
      });

      await supabase
        .from("orcamentos")
        .update({ alerta_enviado: true })
        .eq("id", orc.id);
    }

    console.log(`${orcamentosVencidos.length} alertas de vencimento processados`);
    return { success: true, count: orcamentosVencidos.length };
  } catch (err) {
    console.error("Erro ao verificar orçamentos vencidos:", err);
    return { success: false, error: err };
  }
}

export async function adicionarAlerta(alert: {
  orcamento_id: string;
  tipo: string;
  mensagem: string;
  severidade: "info" | "warning" | "error";
}) {
  try {
    const { error } = await supabase.from("alertas").insert([
      {
        ...alert,
        data_criacao: new Date().toISOString(),
        lido: false,
      },
    ]);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("Erro ao adicionar alerta:", err);
    return { success: false, error: err };
  }
}

export async function obterAlertas(orcamentoId?: string) {
  try {
    let query = supabase.from("alertas").select("*").eq("lido", false);

    if (orcamentoId) {
      query = query.eq("orcamento_id", orcamentoId);
    }

    const { data, error } = await query.order("data_criacao", {
      ascending: false,
    });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Erro ao obter alertas:", err);
    return [];
  }
}

export async function marcarAlertaComoLido(alertaId: string) {
  try {
    const { error } = await supabase
      .from("alertas")
      .update({ lido: true })
      .eq("id", alertaId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("Erro ao marcar alerta como lido:", err);
    return { success: false, error: err };
  }
}
