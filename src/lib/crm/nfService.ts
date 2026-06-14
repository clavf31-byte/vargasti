import { supabase } from "@/integrations/supabase/client";

export async function gerarNotaFiscal(
  orcamentoId: string,
  clienteId: string,
  clienteNome: string,
  totalOrcamento: number,
  dataEmissao: string
) {
  try {
    const numeroNF = gerarNumeroNF();

    const { error: insertError } = await supabase.from("notas_fiscais").insert([
      {
        orcamento_id: orcamentoId,
        cliente_id: clienteId,
        numero: numeroNF,
        valor_total: totalOrcamento,
        data_emissao: dataEmissao,
        status: "gerada",
        pdf_url: `/nf/${numeroNF}.pdf`,
        xml_url: `/nf/${numeroNF}.xml`,
      },
    ]);

    if (insertError) throw insertError;

    console.log(`Nota Fiscal gerada: ${numeroNF}`);
    return { success: true, numeroNF };
  } catch (err) {
    console.error("Erro ao gerar NF:", err);
    return { success: false, error: err };
  }
}

function gerarNumeroNF(): string {
  const now = new Date();
  const numero = `NF-${now.getFullYear()}-${String(Math.floor(Math.random() * 1000000)).padStart(6, "0")}`;
  return numero;
}

export async function obterNotaFiscal(orcamentoId: string) {
  try {
    const { data, error } = await supabase
      .from("notas_fiscais")
      .select("*")
      .eq("orcamento_id", orcamentoId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  } catch (err) {
    console.error("Erro ao obter NF:", err);
    return null;
  }
}
