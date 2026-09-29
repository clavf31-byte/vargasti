import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AtendimentoStatus = "aberto" | "em_triagem" | "em_andamento" | "concluido";
export type AtendimentoPrioridade = "alta" | "normal" | "baixa";
export type ComentarioTipo = "comentario" | "sistema";

export interface Atendimento {
  id: string;
  numero_formatado: string | null;
  titulo: string;
  descricao: string | null;
  status: AtendimentoStatus;
  prioridade: AtendimentoPrioridade;
  cliente_id: string | null;
  responsavel_id: string | null;
  user_id: string;
  anotacoes: string | null;
  data_inicio: string | null;
  data_conclusao: string | null;
  data_agendamento: string | null;
  orcamento_id: string | null;
  ordem_servico_id: string | null;
  pagamento_id: string | null;
  equipamento: string | null;
  defeito: string | null;
  created_at: string;
  updated_at: string;
  cliente_nome?: string;
}

export interface ComentarioAtendimento {
  id: string;
  atendimento_id: string;
  user_id: string;
  conteudo: string;
  tipo: ComentarioTipo;
  metadata: Record<string, string> | null;
  created_at: string;
  autor_nome?: string;
}

// Backward compatibility aliases
export type ChamadoStatus = AtendimentoStatus;
export type ChamadoPrioridade = AtendimentoPrioridade;
export interface Chamado extends Atendimento {
  chamado_id?: string;
}
export interface Comentario extends ComentarioAtendimento {
  chamado_id?: string;
}

export function useAtendimentos(userId?: string) {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data } = await (supabase as any)
        .from("atendimentos")
        .select("*, clientes(nome)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setAtendimentos(
        (data || []).map((r: any) => ({ ...r, cliente_nome: r.clientes?.nome ?? "—" }))
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function createAtendimento(data: {
    titulo: string;
    descricao?: string;
    cliente_id?: string;
    prioridade: AtendimentoPrioridade;
    equipamento?: string;
    defeito?: string;
    data_agendamento?: string;
  }) {
    if (!userId) return null;
    const { data: row, error } = await (supabase as any)
      .from("atendimentos")
      .insert({ user_id: userId, status: "aberto", ...data })
      .select("*, clientes(nome)")
      .single();
    if (error) { console.error(error); return null; }
    const att: Atendimento = { ...row, cliente_nome: row.clientes?.nome ?? "—" };
    setAtendimentos((prev) => [att, ...prev]);
    return att;
  }

  async function updateAtendimento(id: string, changes: Partial<Atendimento>) {
    const { error } = await (supabase as any).from("atendimentos").update(changes).eq("id", id);
    if (error) { console.error(error); return; }
    setAtendimentos((prev) => prev.map((c) => (c.id === id ? { ...c, ...changes } : c)));
  }

  async function deleteAtendimento(id: string) {
    await (supabase as any).from("atendimentos").delete().eq("id", id);
    setAtendimentos((prev) => prev.filter((c) => c.id !== id));
  }

  return { atendimentos, loading, createAtendimento, updateAtendimento, deleteAtendimento, reload: load };
}

// Backward compatibility alias
export function useChamados(userId?: string) {
  const { atendimentos, loading, createAtendimento, updateAtendimento, deleteAtendimento, reload } = useAtendimentos(userId);
  return {
    chamados: atendimentos,
    loading,
    createChamado: createAtendimento,
    updateChamado: updateAtendimento,
    deleteChamado: deleteAtendimento,
    reload,
  };
}

export function useAtendimento(id: string, userId?: string) {
  const [atendimento, setAtendimento] = useState<Atendimento | null>(null);
  const [loading, setLoading] = useState(true);
  const [comentarios, setComentarios] = useState<ComentarioAtendimento[]>([]);
  const [loadingComentarios, setLoadingComentarios] = useState(false);

  useEffect(() => {
    if (!userId || !id) return;
    loadAtendimento();
    loadComentarios();
  }, [id, userId]);

  async function loadAtendimento() {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("atendimentos")
      .select("*, clientes(nome)")
      .eq("id", id)
      .single();
    if (data) setAtendimento({ ...data, cliente_nome: data.clientes?.nome ?? "—" });
    setLoading(false);
  }

  async function loadComentarios() {
    setLoadingComentarios(true);
    const { data } = await (supabase as any)
      .from("atendimento_comentarios")
      .select("*, profiles(full_name)")
      .eq("atendimento_id", id)
      .order("created_at", { ascending: true });
    setComentarios(
      (data || []).map((r: any) => ({
        ...r,
        autor_nome: r.profiles?.full_name ?? "Usuário",
      }))
    );
    setLoadingComentarios(false);
  }

  async function update(changes: Partial<Atendimento>, logStatus?: string) {
    if (!atendimento) return;
    await (supabase as any).from("atendimentos").update(changes).eq("id", id);
    setAtendimento((prev) => prev ? { ...prev, ...changes } : prev);

    if (logStatus && userId) {
      const evento: any = {
        atendimento_id: id,
        user_id: userId,
        conteudo: logStatus,
        tipo: "sistema",
      };
      const { data: comentRow } = await (supabase as any)
        .from("atendimento_comentarios")
        .insert(evento)
        .select("*, profiles(full_name)")
        .single();
      if (comentRow) {
        setComentarios((prev) => [
          ...prev,
          { ...comentRow, autor_nome: comentRow.profiles?.full_name ?? "Sistema" },
        ]);
      }
    }
  }

  async function addComentario(conteudo: string) {
    if (!userId || !conteudo.trim()) return;
    const { data: row } = await (supabase as any)
      .from("atendimento_comentarios")
      .insert({ atendimento_id: id, user_id: userId, conteudo: conteudo.trim(), tipo: "comentario" })
      .select("*, profiles(full_name)")
      .single();
    if (row) {
      setComentarios((prev) => [
        ...prev,
        { ...row, autor_nome: row.profiles?.full_name ?? "Usuário" },
      ]);
    }
  }

  return { atendimento, loading, comentarios, loadingComentarios, update, addComentario };
}

// Backward compatibility alias
export function useChamado(id: string, userId?: string) {
  const { atendimento, loading, comentarios, loadingComentarios, update, addComentario } = useAtendimento(id, userId);
  return { chamado: atendimento, loading, comentarios, loadingComentarios, update, addComentario };
}
