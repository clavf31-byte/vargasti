import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ChamadoStatus = "aberto" | "em_triagem" | "em_andamento" | "concluido";
export type ChamadoPrioridade = "alta" | "normal" | "baixa";
export type ComentarioTipo = "comentario" | "sistema";

export interface Chamado {
  id: string;
  numero_formatado: string | null;
  titulo: string;
  descricao: string | null;
  status: ChamadoStatus;
  prioridade: ChamadoPrioridade;
  cliente_id: string | null;
  responsavel_id: string | null;
  user_id: string;
  anotacoes: string | null;
  data_inicio: string | null;
  data_conclusao: string | null;
  created_at: string;
  updated_at: string;
  cliente_nome?: string;
}

export interface Comentario {
  id: string;
  chamado_id: string;
  user_id: string;
  conteudo: string;
  tipo: ComentarioTipo;
  metadata: Record<string, string> | null;
  created_at: string;
  autor_nome?: string;
}

export function useChamados(userId?: string) {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data } = await (supabase as any)
        .from("chamados")
        .select("*, clientes(nome)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setChamados(
        (data || []).map((r: any) => ({ ...r, cliente_nome: r.clientes?.nome ?? "—" }))
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function createChamado(data: {
    titulo: string;
    descricao?: string;
    cliente_id?: string;
    prioridade: ChamadoPrioridade;
  }) {
    if (!userId) return null;
    const { data: row, error } = await (supabase as any)
      .from("chamados")
      .insert({ user_id: userId, status: "aberto", ...data })
      .select("*, clientes(nome)")
      .single();
    if (error) { console.error(error); return null; }
    const c: Chamado = { ...row, cliente_nome: row.clientes?.nome ?? "—" };
    setChamados((prev) => [c, ...prev]);
    return c;
  }

  async function updateChamado(id: string, changes: Partial<Chamado>) {
    const { error } = await (supabase as any).from("chamados").update(changes).eq("id", id);
    if (error) { console.error(error); return; }
    setChamados((prev) => prev.map((c) => (c.id === id ? { ...c, ...changes } : c)));
  }

  async function deleteChamado(id: string) {
    await (supabase as any).from("chamados").delete().eq("id", id);
    setChamados((prev) => prev.filter((c) => c.id !== id));
  }

  return { chamados, loading, createChamado, updateChamado, deleteChamado, reload: load };
}

export function useChamado(id: string, userId?: string) {
  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [loading, setLoading] = useState(true);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [loadingComentarios, setLoadingComentarios] = useState(false);

  useEffect(() => {
    if (!userId || !id) return;
    loadChamado();
    loadComentarios();
  }, [id, userId]);

  async function loadChamado() {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("chamados")
      .select("*, clientes(nome)")
      .eq("id", id)
      .single();
    if (data) setChamado({ ...data, cliente_nome: data.clientes?.nome ?? "—" });
    setLoading(false);
  }

  async function loadComentarios() {
    setLoadingComentarios(true);
    const { data } = await (supabase as any)
      .from("chamado_comentarios")
      .select("*, profiles(full_name)")
      .eq("chamado_id", id)
      .order("created_at", { ascending: true });
    setComentarios(
      (data || []).map((r: any) => ({
        ...r,
        autor_nome: r.profiles?.full_name ?? "Usuário",
      }))
    );
    setLoadingComentarios(false);
  }

  async function update(changes: Partial<Chamado>, logStatus?: string) {
    if (!chamado) return;
    await (supabase as any).from("chamados").update(changes).eq("id", id);
    setChamado((prev) => prev ? { ...prev, ...changes } : prev);

    if (logStatus && userId) {
      const evento: any = {
        chamado_id: id,
        user_id: userId,
        conteudo: logStatus,
        tipo: "sistema",
      };
      const { data: comentRow } = await (supabase as any)
        .from("chamado_comentarios")
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
      .from("chamado_comentarios")
      .insert({ chamado_id: id, user_id: userId, conteudo: conteudo.trim(), tipo: "comentario" })
      .select("*, profiles(full_name)")
      .single();
    if (row) {
      setComentarios((prev) => [
        ...prev,
        { ...row, autor_nome: row.profiles?.full_name ?? "Usuário" },
      ]);
    }
  }

  return { chamado, loading, comentarios, loadingComentarios, update, addComentario };
}
