import { supabase } from "@/integrations/supabase/client";

interface NotaFiscalInput {
  orcamento_id?: string;
  os_id?: string;
  cliente_id: string;
  user_id: string;
  valor_subtotal: number;
  valor_desconto?: number;
  valor_impostos?: number;
  valor_total: number;
  data_emissao?: string;
}

interface NotaFiscal {
  id: string;
  numero_nfe: string;
  status: string;
  data_emissao: string;
}

export async function criarNotaFiscal(
  input: NotaFiscalInput
): Promise<{ success: boolean; nf?: NotaFiscal; error?: string }> {
  try {
    // Gerar número sequencial para NF (simplificado)
    const year = new Date().getFullYear();
    const { data: seqData } = await supabase
      .from("orcamento_sequences")
      .select("next_number")
      .eq("year", year)
      .eq("user_id", input.user_id)
      .single();

    const nextNumber = (seqData?.next_number || 1) + 1;
    const numeroNF = String(nextNumber).padStart(8, "0");

    // Criar NF
    const dataEmissao = input.data_emissao || new Date().toISOString().split("T")[0];

    const { data: nfData, error: nfError } = await supabase
      .from("notas_fiscais")
      .insert([
        {
          user_id: input.user_id,
          cliente_id: input.cliente_id,
          orcamento_id: input.orcamento_id,
          os_id: input.os_id,
          numero_nfe: numeroNF,
          serie_nfe: 1,
          data_emissao: dataEmissao,
          data_saida: dataEmissao,
          valor_subtotal: input.valor_subtotal,
          valor_desconto: input.valor_desconto || 0,
          valor_impostos: input.valor_impostos || 0,
          valor_total: input.valor_total,
          status: "rascunho",
        },
      ])
      .select()
      .single();

    if (nfError) throw nfError;

    // Atualizar cliente_financeiro
    await atualizarFinanceiroAposNF(input.cliente_id, input.valor_total);

    // Atualizar status do orçamento (se existir)
    if (input.orcamento_id) {
      await supabase
        .from("orcamentos")
        .update({ status_enum: "faturado" })
        .eq("id", input.orcamento_id);
    }

    return {
      success: true,
      nf: {
        id: nfData.id,
        numero_nfe: numeroNF,
        status: "rascunho",
        data_emissao: dataEmissao,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao criar NF",
    };
  }
}

export async function atualizarStatusNF(
  nfId: string,
  novoStatus: "rascunho" | "emitida" | "cancelada"
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("notas_fiscais")
      .update({ status: novoStatus, updated_at: new Date().toISOString() })
      .eq("id", nfId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao atualizar NF",
    };
  }
}

async function atualizarFinanceiroAposNF(
  clienteId: string,
  valorNF: number
): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from("cliente_financeiro")
      .select("*")
      .eq("cliente_id", clienteId)
      .single();

    if (existing) {
      await supabase
        .from("cliente_financeiro")
        .update({
          total_nf: (existing.total_nf || 0) + valorNF,
          qtd_nf: (existing.qtd_nf || 0) + 1,
          total_aberto: (existing.total_aberto || 0) + valorNF,
        })
        .eq("cliente_id", clienteId);
    } else {
      await supabase.from("cliente_financeiro").insert([
        {
          cliente_id: clienteId,
          total_nf: valorNF,
          qtd_nf: 1,
          total_aberto: valorNF,
        },
      ]);
    }
  } catch (err) {
    console.error("Erro ao atualizar financeiro:", err);
  }
}

export async function obterNotaFiscal(nfId: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from("notas_fiscais")
      .select(
        `
        *,
        cliente:cliente_id (id, nome, email, cnpj_cpf),
        orcamento:orcamento_id (numero_formatado),
        os:os_id (numero_formatado)
      `
      )
      .eq("id", nfId)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    return null;
  }
}
