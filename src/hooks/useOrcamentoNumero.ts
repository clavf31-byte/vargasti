import { supabase } from "@/integrations/supabase/client";

export async function gerarNumeroOrcamento(userId: string): Promise<string> {
  const currentYear = new Date().getFullYear();

  try {
    // Buscar ou criar sequence para o ano atual
    const { data: existing } = await supabase
      .from("orcamento_sequences")
      .select("next_number")
      .eq("user_id", userId)
      .eq("year", currentYear)
      .single();

    let nextNumber = 1;

    if (existing) {
      // Incrementar sequence existente
      const { data: updated, error } = await supabase
        .from("orcamento_sequences")
        .update({ next_number: existing.next_number + 1 })
        .eq("user_id", userId)
        .eq("year", currentYear)
        .select("next_number")
        .single();

      if (error) throw error;
      nextNumber = updated.next_number;
    } else {
      // Criar nova sequence
      const { data: created, error } = await supabase
        .from("orcamento_sequences")
        .insert([
          {
            user_id: userId,
            year: currentYear,
            next_number: 2,
          },
        ])
        .select("next_number")
        .single();

      if (error) throw error;
      nextNumber = created.next_number || 1;
    }

    // Formatar: ORC-2026-000001
    return `ORC-${currentYear}-${String(nextNumber).padStart(6, "0")}`;
  } catch (err) {
    console.error("Erro ao gerar número de orçamento:", err);
    throw err;
  }
}
