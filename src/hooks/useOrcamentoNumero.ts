import { supabase } from "@/integrations/supabase/client";

export async function previewNumeroOrcamento(userId: string): Promise<string> {
  const currentYear = new Date().getFullYear();
  const { data } = await supabase
    .from("orcamento_sequences")
    .select("next_number")
    .eq("user_id", userId)
    .eq("year", currentYear)
    .single();
  const next = data ? data.next_number + 1 : 1;
  return formatarNumero(currentYear, next);
}

function formatarNumero(ano: number, n: number): string {
  return `ORC-${ano}-${String(n).padStart(3, "0")}`;
}

export async function gerarNumeroOrcamento(userId: string): Promise<string> {
  const currentYear = new Date().getFullYear();

  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const { data: existing } = await supabase
      .from("orcamento_sequences")
      .select("next_number")
      .eq("user_id", userId)
      .eq("year", currentYear)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase
        .from("orcamento_sequences")
        .insert([{ user_id: userId, year: currentYear, next_number: 1 }]);
      if (!error) return formatarNumero(currentYear, 1);
      if (error.code !== "23505") throw error;
      continue;
    }

    const proximo = existing.next_number + 1;
    const { data: atualizado, error } = await supabase
      .from("orcamento_sequences")
      .update({ next_number: proximo })
      .eq("user_id", userId)
      .eq("year", currentYear)
      .eq("next_number", existing.next_number)
      .select("next_number");
    if (error) throw error;
    if (atualizado && atualizado.length > 0) return formatarNumero(currentYear, proximo);
  }

  throw new Error("Não foi possível gerar o número do orçamento. Tente novamente.");
}

export async function buscarRascunhoVazio(
  userId: string,
  atendimentoId?: string | null
): Promise<{ id: string; numero_formatado: string } | null> {
  let query = supabase
    .from("orcamentos")
    .select("id, numero_formatado, descricao")
    .eq("user_id", userId)
    .eq("status", "rascunho")
    .eq("total", 0)
    .order("created_at", { ascending: true });

  query = atendimentoId ? query.eq("atendimento_id", atendimentoId) : query.is("atendimento_id", null);

  const { data } = await query.limit(20);
  for (const orc of data || []) {
    if (orc.descricao && orc.descricao.trim()) continue;
    const { data: itens } = await supabase
      .from("orcamento_itens")
      .select("id")
      .eq("orcamento_id", orc.id)
      .limit(1);
    if (!itens || itens.length === 0) {
      return { id: orc.id, numero_formatado: orc.numero_formatado || "" };
    }
  }
  return null;
}
