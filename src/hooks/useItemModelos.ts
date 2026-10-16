import { supabase } from "@/integrations/supabase/client";

export async function obterItemModelos(user_id: string) {
  try {
    const { data, error } = await supabase
      .from("item_modelos")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Erro ao obter modelos de itens:", err);
    return [];
  }
}

export async function criarItemModelo(
  user_id: string,
  nome: string,
  descricao: string,
  tipo: "servico" | "peca",
  preco_unitario: number,
  unidade: string = "Unidade",
  tarefas: string[] = []
) {
  try {
    const { data, error } = await supabase
      .from("item_modelos")
      .insert({
        user_id,
        nome,
        descricao,
        tipo,
        preco_unitario,
        unidade,
        tarefas,
      })
      .select();

    if (error) throw error;
    return { success: true, data: data?.[0] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao criar modelo";
    return { success: false, error: msg };
  }
}

export async function atualizarItemModelo(
  modelo_id: string,
  nome: string,
  descricao: string,
  tipo: "servico" | "peca",
  preco_unitario: number,
  unidade: string,
  tarefas: string[] = []
) {
  try {
    const { data, error } = await supabase
      .from("item_modelos")
      .update({
        nome,
        descricao,
        tipo,
        preco_unitario,
        unidade,
        tarefas,
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

export async function deletarItemModelo(modelo_id: string) {
  try {
    const { error } = await supabase
      .from("item_modelos")
      .delete()
      .eq("id", modelo_id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao deletar modelo";
    return { success: false, error: msg };
  }
}
