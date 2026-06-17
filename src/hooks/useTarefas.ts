import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Tarefa {
  id: string;
  user_id?: string;
  cliente_id?: string | null;
  orcamento_id?: string | null;
  titulo: string;
  descricao?: string | null;
  status: "aberta" | "em_progresso" | "concluida";
  prioridade: "baixa" | "normal" | "alta";
  data_vencimento: string;
}

export function useTarefas(userId?: string, clienteId?: string, orcamentoId?: string) {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) loadTarefas();
  }, [userId, clienteId, orcamentoId]);

  async function loadTarefas() {
    if (!userId) return;
    setLoading(true);
    try {
      let query = supabase.from("tarefas").select("*").eq("user_id", userId);
      if (clienteId) query = query.eq("cliente_id", clienteId);
      if (orcamentoId) query = query.eq("orcamento_id", orcamentoId);

      const { data, error } = await query.order("data_vencimento", { ascending: true });
      if (error) throw error;
      setTarefas((data || []) as Tarefa[]);
    } catch (err) {
      console.error("Erro ao carregar tarefas:", err);
    } finally {
      setLoading(false);
    }
  }

  async function addTarefa() {
    if (!userId) return;
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);

    const { data, error } = await supabase
      .from("tarefas")
      .insert([{
        user_id: userId,
        titulo: "",
        descricao: null,
        status: "aberta",
        prioridade: "normal",
        data_vencimento: amanha.toISOString().split("T")[0],
        cliente_id: clienteId || null,
        orcamento_id: orcamentoId || null,
      }])
      .select()
      .single();

    if (error) { console.error("Erro ao criar tarefa:", error); return; }
    setTarefas(prev => [...prev, data as Tarefa]);
  }

  async function updateTarefa(id: string, changes: Partial<Omit<Tarefa, "id">>) {
    const { error } = await supabase.from("tarefas").update(changes).eq("id", id);
    if (error) { console.error("Erro ao atualizar tarefa:", error); return; }
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t));
  }

  async function removeTarefa(id: string) {
    const { error } = await supabase.from("tarefas").delete().eq("id", id);
    if (error) { console.error("Erro ao remover tarefa:", error); return; }
    setTarefas(prev => prev.filter(t => t.id !== id));
  }

  async function toggleStatus(id: string) {
    const tarefa = tarefas.find(t => t.id === id);
    if (!tarefa) return;
    const statusMap = {
      aberta: "em_progresso",
      em_progresso: "concluida",
      concluida: "aberta",
    } as const;
    await updateTarefa(id, { status: statusMap[tarefa.status] });
  }

  return { tarefas, loading, addTarefa, updateTarefa, removeTarefa, toggleStatus };
}
