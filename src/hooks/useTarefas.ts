import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Tarefa {
  id?: string;
  user_id?: string;
  cliente_id?: string;
  orcamento_id?: string;
  titulo: string;
  descricao?: string;
  status: "aberta" | "em_progresso" | "concluida";
  prioridade: "baixa" | "normal" | "alta";
  data_vencimento: string;
}

export function useTarefas(clienteId?: string, orcamentoId?: string) {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clienteId || orcamentoId) {
      loadTarefas();
    }
  }, [clienteId, orcamentoId]);

  async function loadTarefas() {
    setLoading(true);
    try {
      let query = supabase.from("tarefas").select("*");

      if (clienteId) {
        query = query.eq("cliente_id", clienteId);
      }
      if (orcamentoId) {
        query = query.eq("orcamento_id", orcamentoId);
      }

      const { data, error } = await query.order("data_vencimento", {
        ascending: true,
      });

      if (error) throw error;
      setTarefas((data || []) as Tarefa[]);
    } catch (err) {
      console.error("Erro ao carregar tarefas:", err);
    } finally {
      setLoading(false);
    }
  }

  function addTarefa() {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const newTarefa: Tarefa = {
      titulo: "",
      descricao: "",
      status: "aberta",
      prioridade: "normal",
      data_vencimento: amanha.toISOString().split("T")[0],
      cliente_id: clienteId,
      orcamento_id: orcamentoId,
    };
    setTarefas([...tarefas, newTarefa]);
  }

  function updateTarefa(index: number, tarefa: Tarefa) {
    const updated = [...tarefas];
    updated[index] = tarefa;
    setTarefas(updated);
  }

  function removeTarefa(index: number) {
    setTarefas(tarefas.filter((_, i) => i !== index));
  }

  function toggleStatus(index: number) {
    const tarefa = tarefas[index];
    const statusMap = {
      aberta: "em_progresso",
      em_progresso: "concluida",
      concluida: "aberta",
    };
    updateTarefa(index, {
      ...tarefa,
      status: statusMap[tarefa.status] as any,
    });
  }

  async function saveTarefas(userId: string) {
    try {
      const tarefasToSave = tarefas
        .filter((t) => t.titulo.trim())
        .map((t) => ({
          user_id: userId,
          titulo: t.titulo,
          descricao: t.descricao || null,
          status: t.status,
          prioridade: t.prioridade,
          data_vencimento: t.data_vencimento,
          cliente_id: clienteId || null,
          orcamento_id: orcamentoId || null,
        }));

      if (tarefasToSave.length > 0) {
        const { error } = await supabase
          .from("tarefas")
          .insert(tarefasToSave);

        if (error) throw error;
      }

      return true;
    } catch (err) {
      console.error("Erro ao salvar tarefas:", err);
      throw err;
    }
  }

  return {
    tarefas,
    loading,
    addTarefa,
    updateTarefa,
    removeTarefa,
    toggleStatus,
    saveTarefas,
    loadTarefas,
  };
}
