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
  return `ORC-${currentYear}-${String(next).padStart(6, "0")}`;
}

export async function gerarNumeroOrcamento(userId: string): Promise<string> {
  const currentYear = new Date().getFullYear();

  try {
    // Buscar ou criar sequence para o ano atual
    const { data: existing, error: selectError } = await supabase
      .from("orcamento_sequences")
      .select("next_number")
      .eq("user_id", userId)
      .eq("year", currentYear)
      .single();

    let nextNumber = 1;

    if (existing && !selectError) {
      // Incrementar sequence existente
      const { error } = await supabase
        .from("orcamento_sequences")
        .update({ next_number: existing.next_number + 1 })
        .eq("user_id", userId)
        .eq("year", currentYear);

      if (error) throw error;
      nextNumber = existing.next_number + 1;
    } else {
      // Criar nova sequence (não existe ainda)
      const { error } = await supabase
        .from("orcamento_sequences")
        .insert([
          {
            user_id: userId,
            year: currentYear,
            next_number: 2,
          },
        ]);

      if (error) {
        // Se falhar por duplicate key, tenta atualizar
        if (error.code === "23505") {
          const { data: freshData } = await supabase
            .from("orcamento_sequences")
            .select("next_number")
            .eq("user_id", userId)
            .eq("year", currentYear)
            .single();

          if (freshData) {
            nextNumber = freshData.next_number + 1;
            await supabase
              .from("orcamento_sequences")
              .update({ next_number: nextNumber })
              .eq("user_id", userId)
              .eq("year", currentYear);
          }
        } else {
          throw error;
        }
      } else {
        nextNumber = 2;
      }
    }

    // Formatar: ORC-2026-000001
    return `ORC-${currentYear}-${String(nextNumber).padStart(6, "0")}`;
  } catch (err) {
    console.error("Erro ao gerar número de orçamento:", err);
    throw err;
  }
}
