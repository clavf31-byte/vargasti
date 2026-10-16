import { supabase } from "@/integrations/supabase/client";

export async function obterModelos(user_id: string) {
  try {
    const { data, error } = await supabase
      .from("orcamento_modelos")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Erro ao obter modelos:", err);
    return [];
  }
}

export async function obterModelo(modelo_id: string) {
  try {
    const { data, error } = await supabase
      .from("orcamento_modelos")
      .select("*")
      .eq("id", modelo_id)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Erro ao obter modelo:", err);
    return null;
  }
}

export async function criarModelo(
  user_id: string,
  nome: string,
  descricao: string,
  itens: any[]
) {
  try {
    const { data, error } = await supabase
      .from("orcamento_modelos")
      .insert({
        user_id,
        nome,
        descricao,
        itens: itens || [],
      })
      .select();

    if (error) throw error;
    return { success: true, data: data?.[0] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao criar modelo";
    return { success: false, error: msg };
  }
}

export async function atualizarModelo(
  modelo_id: string,
  nome: string,
  descricao: string,
  itens: any[]
) {
  try {
    const { data, error } = await supabase
      .from("orcamento_modelos")
      .update({
        nome,
        descricao,
        itens: itens || [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", modelo_id)
      .select();

    if (error) throw error;
    return { success: true, data: data?.[0] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao atualizar modelo";
    return { success: false, error: msg };
  }
}

export async function deletarModelo(modelo_id: string) {
  try {
    const { error } = await supabase
      .from("orcamento_modelos")
      .delete()
      .eq("id", modelo_id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao deletar modelo";
    return { success: false, error: msg };
  }
}

export async function salvarOrcamentoComoModelo(
  user_id: string,
  nome: string,
  descricao: string,
  itens: any[]
) {
  return criarModelo(user_id, nome, descricao, itens);
}
