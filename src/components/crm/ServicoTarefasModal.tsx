import { useEffect, useState } from "react";
import { X, Plus, Trash2, GripVertical } from "lucide-react";
import { obterTarefasServico, adicionarTarefa, atualizarTarefa, deletarTarefa, reordenarTarefas } from "@/hooks/useServicoTarefas";

interface ServicoTarefasModalProps {
  servicoId: string;
  servicoNome: string;
  onClose: () => void;
}

export function ServicoTarefasModal({ servicoId, servicoNome, onClose }: ServicoTarefasModalProps) {
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [novaDescricao, setNovaDescricao] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    carregarTarefas();
  }, [servicoId]);

  async function carregarTarefas() {
    setLoading(true);
    const data = await obterTarefasServico(servicoId);
    setTarefas(data);
    setLoading(false);
  }

  async function handleAdicionarTarefa() {
    if (!novaDescricao.trim()) return;

    setSaving(true);
    const ordem = Math.max(...tarefas.map(t => t.ordem), -1) + 1;
    const result = await adicionarTarefa(servicoId, novaDescricao.trim(), ordem);

    if (result.success && result.data) {
      setTarefas([...tarefas, result.data]);
      setNovaDescricao("");
    } else {
      alert("Erro ao adicionar tarefa: " + result.error);
    }
    setSaving(false);
  }

  async function handleAtualizarTarefa(id: string, descricao: string) {
    setSaving(true);
    const result = await atualizarTarefa(id, descricao);

    if (result.success) {
      setTarefas(tarefas.map(t => t.id === id ? { ...t, descricao } : t));
    } else {
      alert("Erro ao atualizar tarefa: " + result.error);
    }
    setSaving(false);
  }

  async function handleDeletarTarefa(id: string) {
    if (!confirm("Remover esta tarefa?")) return;

    setSaving(true);
    const result = await deletarTarefa(id);

    if (result.success) {
      setTarefas(tarefas.filter(t => t.id !== id));
    } else {
      alert("Erro ao deletar tarefa: " + result.error);
    }
    setSaving(false);
  }

  async function handleReordenar(fromIndex: number, toIndex: number) {
    const newTarefas = [...tarefas];
    const [moved] = newTarefas.splice(fromIndex, 1);
    newTarefas.splice(toIndex, 0, moved);

    const reordered = newTarefas.map((t, idx) => ({ ...t, ordem: idx }));
    setTarefas(reordered);

    setSaving(true);
    const result = await reordenarTarefas(
      reordered.map(t => ({ id: t.id, ordem: t.ordem }))
    );
    if (!result.success) {
      alert("Erro ao reordenar: " + result.error);
      await carregarTarefas();
    }
    setSaving(false);
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={styles.title}>Tarefas do Serviço</div>
            <div style={styles.subtitle}>{servicoNome}</div>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {loading ? (
            <div style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>
              Carregando tarefas...
            </div>
          ) : (
            <>
              {/* Lista de tarefas */}
              {tarefas.length > 0 && (
                <div style={styles.tarefasList}>
                  {tarefas.map((tarefa, idx) => (
                    <div key={tarefa.id} style={styles.tarefaItem}>
                      <div style={styles.dragHandle}>
                        <GripVertical size={16} />
                      </div>
                      <input
                        type="text"
                        value={tarefa.descricao}
                        onChange={(e) => handleAtualizarTarefa(tarefa.id, e.target.value)}
                        style={styles.tarefaInput}
                        disabled={saving}
                      />
                      <button
                        onClick={() => handleDeletarTarefa(tarefa.id)}
                        style={styles.deleteBtn}
                        disabled={saving}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {tarefas.length === 0 && (
                <div style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}>
                  Nenhuma tarefa adicionada ainda
                </div>
              )}

              {/* Adicionar nova tarefa */}
              <div style={styles.novasTarefaSection}>
                <label style={styles.label}>Adicionar Nova Tarefa</label>
                <div style={styles.inputGroup}>
                  <input
                    type="text"
                    value={novaDescricao}
                    onChange={(e) => setNovaDescricao(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAdicionarTarefa()}
                    placeholder="Digite a descrição da tarefa..."
                    style={styles.input}
                    disabled={saving}
                  />
                  <button
                    onClick={handleAdicionarTarefa}
                    style={styles.addBtn}
                    disabled={!novaDescricao.trim() || saving}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button onClick={onClose} style={styles.btnCancel}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 20px 25px rgba(0,0,0,0.15)",
    width: "90%",
    maxWidth: "500px",
    maxHeight: "80vh",
    display: "flex",
    flexDirection: "column" as const,
  },
  header: {
    padding: "20px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#0f172a",
  },
  subtitle: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "4px",
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#94a3b8",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.2s",
  },
  content: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "20px",
  },
  tarefasList: {
    marginBottom: "24px",
  },
  tarefaItem: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    padding: "12px",
    background: "#f8fafc",
    borderRadius: "6px",
    marginBottom: "8px",
    border: "1px solid #e2e8f0",
  },
  dragHandle: {
    color: "#cbd5e1",
    cursor: "grab",
    display: "flex",
    alignItems: "center",
  },
  tarefaInput: {
    flex: 1,
    border: "none",
    background: "transparent",
    padding: "0",
    fontSize: "14px",
    fontFamily: "inherit",
    color: "#1e293b",
  },
  deleteBtn: {
    background: "#fee2e2",
    border: "none",
    color: "#dc2626",
    padding: "6px 8px",
    borderRadius: "4px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  novasTarefaSection: {
    paddingTop: "20px",
    borderTop: "1px solid #e2e8f0",
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    color: "#64748b",
    marginBottom: "8px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  inputGroup: {
    display: "flex",
    gap: "8px",
  },
  input: {
    flex: 1,
    padding: "10px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: "inherit",
    color: "#1e293b",
    transition: "all 0.2s",
  },
  addBtn: {
    background: "#0bd0d7",
    color: "white",
    border: "none",
    padding: "10px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  footer: {
    padding: "16px 20px",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "flex-end",
  },
  btnCancel: {
    padding: "10px 16px",
    border: "1px solid #e2e8f0",
    background: "white",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    color: "#64748b",
    transition: "all 0.2s",
  },
};
