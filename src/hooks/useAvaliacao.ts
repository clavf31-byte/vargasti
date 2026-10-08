import { supabase } from "@/integrations/supabase/client";

export async function obterAvaliacao(orcamento_id: string) {
  try {
    const { data, error } = await supabase
      .from("avaliacoes")
      .select("*")
      .eq("orcamento_id", orcamento_id)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  } catch (err) {
    console.error("Erro ao obter avaliação:", err);
    return null;
  }
}

export async function salvarAvaliacao(
  orcamento_id: string,
  cliente_id: string,
  user_id: string,
  rating: number,
  comentario: string
) {
  try {
    const { data, error } = await supabase
      .from("avaliacoes")
      .upsert({
        orcamento_id,
        cliente_id,
        user_id,
        rating,
        comentario,
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) throw error;
    return { success: true, data: data?.[0] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao salvar avaliação";
    return { success: false, error: msg };
  }
}
