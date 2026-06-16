import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Oportunidade {
  id: string;
  titulo: string;
  cliente_nome: string;
  valor: number;
  probabilidade: number;
  status: "lead" | "qualificado" | "proposta" | "ganho" | "perdido";
}

export function useOportunidades(userId?: string) {
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    loadOportunidades();
  }, [userId]);

  async function loadOportunidades() {
    if (!userId) return;
    setLoading(true);
    try {
      const { data: opData, error } = await supabase
        .from("oportunidades")
        .select(`
          id,
          titulo,
          valor,
          probabilidade,
          status,
          cliente:cliente_id (nome)
        `)
        .eq("user_id", userId)
        .order("etapa_data", { ascending: false });

      if (error) throw error;

      const formatted = (opData || []).map((op: any) => ({
        id: op.id,
        titulo: op.titulo,
        cliente_nome: op.cliente?.nome || "Cliente",
        valor: op.valor || 0,
        probabilidade: op.probabilidade || 50,
        status: op.status,
      }));

      setOportunidades(formatted);
    } catch (err) {
      console.error("Erro ao carregar oportunidades:", err);
    } finally {
      setLoading(false);
    }
  }

  async function addOportunidade(titulo: string, clienteId: string, status: string) {
    if (!userId) throw new Error("Usuário não autenticado");
    try {
      const { data, error } = await supabase
        .from("oportunidades")
        .insert([
          {
            user_id: userId,
            cliente_id: clienteId,
            titulo,
            status,
            valor: 0,
            probabilidade: 50,
          },
        ])
        .select();

      if (error) throw error;

      const newOp = data?.[0];
      if (newOp) {
        const { data: cliente } = await supabase
          .from("clientes")
          .select("nome")
          .eq("id", clienteId)
          .single();

        setOportunidades([
          ...oportunidades,
          {
            id: newOp.id,
            titulo: newOp.titulo,
            cliente_nome: cliente?.nome || "Cliente",
            valor: 0,
            probabilidade: 50,
            status: newOp.status as Oportunidade["status"],
          },
        ]);
      }

      return data?.[0];
    } catch (err) {
      console.error("Erro ao criar oportunidade:", err);
      throw err;
    }
  }

  async function updateOportunidadeStatus(id: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from("oportunidades")
        .update({ status: newStatus, etapa_data: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      setOportunidades(
        oportunidades.map((op) =>
          op.id === id ? { ...op, status: newStatus as any } : op
        )
      );
    } catch (err) {
      console.error("Erro ao atualizar oportunidade:", err);
      throw err;
    }
  }

  async function deleteOportunidade(id: string) {
    try {
      const { error } = await supabase
        .from("oportunidades")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setOportunidades(oportunidades.filter((op) => op.id !== id));
    } catch (err) {
      console.error("Erro ao deletar oportunidade:", err);
      throw err;
    }
  }

  return {
    oportunidades,
    loading,
    addOportunidade,
    updateOportunidadeStatus,
    deleteOportunidade,
    reload: loadOportunidades,
  };
}
