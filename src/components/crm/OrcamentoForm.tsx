import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";

interface OrcamentoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  clientes: Array<{ id: string; nome: string }>;
}

export function OrcamentoForm({ isOpen, onClose, onSuccess, userId, clientes }: OrcamentoFormProps) {
  const [formData, setFormData] = useState({
    numero: "",
    cliente_id: "",
    descricao: "",
    total: "",
    status: "rascunho",
    data_vencimento: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from("orcamentos").insert([
        {
          numero: formData.numero,
          cliente_id: formData.cliente_id,
          notas: formData.descricao,
          total: parseFloat(formData.total) || 0,
          status: formData.status,
          data_vencimento: formData.data_vencimento || null,
          user_id: userId,
        },
      ]);

      if (insertError) throw insertError;

      setFormData({
        numero: "",
        cliente_id: "",
        descricao: "",
        total: "",
        status: "rascunho",
        data_vencimento: "",
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar orçamento");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#061b2a",
          border: "1px solid rgba(19, 200, 211, 0.16)",
          borderRadius: "12px",
          padding: "2rem",
          maxWidth: "500px",
          width: "90%",
          color: "#eaf3f8",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "20px" }}>Novo Orçamento</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#8da2b4",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(211, 47, 47, 0.1)",
              border: "1px solid rgba(211, 47, 47, 0.3)",
              borderRadius: "6px",
              padding: "1rem",
              marginBottom: "1rem",
              color: "#ff6b6b",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem" }}>
              Número *
            </label>
            <input
              type="text"
              required
              value={formData.numero}
              onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "rgba(6, 34, 53, 0.8)",
                border: "1px solid rgba(19, 200, 211, 0.2)",
                borderRadius: "6px",
                color: "#eaf3f8",
                boxSizing: "border-box",
              }}
              placeholder="ORÇ-001"
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem" }}>
              Cliente *
            </label>
            <select
              required
              value={formData.cliente_id}
              onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "rgba(6, 34, 53, 0.8)",
                border: "1px solid rgba(19, 200, 211, 0.2)",
                borderRadius: "6px",
                color: "#eaf3f8",
                boxSizing: "border-box",
              }}
            >
              <option value="">Selecione um cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem" }}>
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "rgba(6, 34, 53, 0.8)",
                border: "1px solid rgba(19, 200, 211, 0.2)",
                borderRadius: "6px",
                color: "#eaf3f8",
                boxSizing: "border-box",
                minHeight: "80px",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem" }}>
              Valor Total (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.total}
              onChange={(e) => setFormData({ ...formData, total: e.target.value })}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "rgba(6, 34, 53, 0.8)",
                border: "1px solid rgba(19, 200, 211, 0.2)",
                borderRadius: "6px",
                color: "#eaf3f8",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem" }}>
              Data de Vencimento
            </label>
            <input
              type="date"
              value={formData.data_vencimento}
              onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "rgba(6, 34, 53, 0.8)",
                border: "1px solid rgba(19, 200, 211, 0.2)",
                borderRadius: "6px",
                color: "#eaf3f8",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem" }}>
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "rgba(6, 34, 53, 0.8)",
                border: "1px solid rgba(19, 200, 211, 0.2)",
                borderRadius: "6px",
                color: "#eaf3f8",
                boxSizing: "border-box",
              }}
            >
              <option value="rascunho">Rascunho</option>
              <option value="enviado">Enviado</option>
              <option value="aprovado">Aprovado</option>
              <option value="rejeitado">Rejeitado</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "10px 16px",
                background: "rgba(19, 200, 211, 0.1)",
                border: "1px solid rgba(19, 200, 211, 0.3)",
                borderRadius: "6px",
                color: "#13c8d3",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px 16px",
                background: "#13c8d3",
                border: "none",
                borderRadius: "6px",
                color: "#061b2a",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 600,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Criando..." : "Criar Orçamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
