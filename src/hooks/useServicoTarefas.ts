import { supabase } from "@/integrations/supabase/client";

export async function obterTarefasServico(servico_id: string) {
  try {
    const { data, error } = await supabase
      .from("servico_tarefas")
      .select("*")
      .eq("servico_id", servico_id)
      .order("ordem", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Erro ao obter tarefas do serviço:", err);
    return [];
  }
}

export async function adicionarTarefa(
  servico_id: string,
  descricao: string,
  ordem: number = 0
) {
  try {
    const { data, error } = await supabase
      .from("servico_tarefas")
      .insert({
        servico_id,
        descricao,
        ordem,
      })
      .select();

    if (error) throw error;
    return { success: true, data: data?.[0] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao adicionar tarefa";
    return { success: false, error: msg };
  }
}

export async function atualizarTarefa(
  tarefa_id: string,
  descricao: string,
  ordem?: number
) {
  try {
    const update: any = { descricao, updated_at: new Date().toISOString() };
    if (ordem !== undefined) update.ordem = ordem;

    const { data, error } = await supabase
      .from("servico_tarefas")
      .update(update)
      .eq("id", tarefa_id)
      .select();

    if (error) throw error;
    return { success: true, data: data?.[0] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao atualizar tarefa";
    return { success: false, error: msg };
  }
}

export async function deletarTarefa(tarefa_id: string) {
  try {
    const { error } = await supabase
      .from("servico_tarefas")
      .delete()
      .eq("id", tarefa_id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao deletar tarefa";
    return { success: false, error: msg };
  }
}

export async function reordenarTarefas(tarefas: Array<{ id: string; ordem: number }>) {
  try {
    const updates = tarefas.map((t) =>
      supabase
        .from("servico_tarefas")
        .update({ ordem: t.ordem, updated_at: new Date().toISOString() })
        .eq("id", t.id)
    );

    const results = await Promise.all(updates);
    const hasError = results.some((r) => r.error);

    if (hasError) throw new Error("Erro ao reordenar tarefas");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao reordenar tarefas";
    return { success: false, error: msg };
  }
}
