import { supabase } from "@/integrations/supabase/client";

interface OrdemServicoInput {
  orcamento_id: string;
  cliente_id: string;
  user_id: string;
  descricao?: string;
  prioridade?: "baixa" | "normal" | "alta";
  data_inicio?: string;
  tecnico?: string;
}

interface OrdemServico {
  id: string;
  numero_formatado: string;
  status: string;
}

export async function criarOrdenServicoDoOrcamento(
  input: OrdemServicoInput
): Promise<{ success: boolean; os?: OrdemServico; error?: string }> {
  try {
    // Buscar orcamento e itens
    const { data: orcamento, error: orcError } = await supabase
      .from("orcamentos")
      .select("*, itens:orcamento_itens(*)")
      .eq("id", input.orcamento_id)
      .single();

    if (orcError) throw orcError;

    // Número da OS via RPC atômico (reserva e devolve OS-AAAA-000000)
    const { data: numeroOS, error: numError } = await supabase.rpc("gerar_numero_os", {
      _user_id: input.user_id,
    });

    if (numError) throw numError;
    if (!numeroOS) throw new Error("Falha ao gerar número da OS");

    // Criar OS
    const { data: osData, error: osError } = await supabase
      .from("ordens_servico")
      .insert([
        {
          user_id: input.user_id,
          cliente_id: input.cliente_id,
          orcamento_id: input.orcamento_id,
          numero_formatado: numeroOS,
          descricao: input.descricao || orcamento.notas,
          tecnico: input.tecnico || null,
          status: "aberta",
          prioridade: input.prioridade || "normal",
          data_inicio: input.data_inicio || new Date().toISOString().split("T")[0],
        },
      ])
      .select()
      .single();

    if (osError) throw osError;

    // Copiar itens da OS
    if (orcamento.itens && orcamento.itens.length > 0) {
      const osItens = orcamento.itens.map((item: any) => ({
        os_id: osData.id,
        tipo: item.tipo || "peca",
        servico_id: item.servico_id,
        peca_id: item.peca_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal,
      }));

      const { error: itensError } = await supabase
        .from("os_itens")
        .insert(osItens);

      if (itensError) throw itensError;
    }

    // Atualizar status do orçamento
    await supabase
      .from("orcamentos")
      .update({ status_enum: "faturado" })
      .eq("id", input.orcamento_id);

    return {
      success: true,
      os: {
        id: osData.id,
        numero_formatado: numeroOS,
        status: "aberta",
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao criar OS",
    };
  }
}

export async function atualizarStatusOS(
  osId: string,
  novoStatus: "aberta" | "em_andamento" | "concluida" | "cancelada"
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("ordens_servico")
      .update({ status: novoStatus, updated_at: new Date().toISOString() })
      .eq("id", osId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao atualizar OS",
    };
  }
}

interface OrdemServicoPatch {
  descricao?: string | null;
  prioridade?: "baixa" | "normal" | "alta";
  data_inicio?: string;
  tecnico?: string | null;
}

export async function atualizarOrdemServico(
  osId: string,
  patch: OrdemServicoPatch
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("ordens_servico")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", osId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao atualizar OS",
    };
  }
}

export async function obterOrdenServico(osId: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from("ordens_servico")
      .select(
        `
        *,
        cliente:cliente_id (id, nome, email, telefone),
        itens:os_itens (*)
      `
      )
      .eq("id", osId)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    return null;
  }
}
