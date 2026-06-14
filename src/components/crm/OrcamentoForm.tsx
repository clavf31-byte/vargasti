import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";

interface OrcamentoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

interface Cliente {
  id: string;
  nome: string;
}

export function OrcamentoForm({ isOpen, onClose, onSuccess, userId }: OrcamentoFormProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [formData, setFormData] = useState({
    cliente_id: "",
    numero: "",
    total: "",
    data_vencimento: "",
    notas: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadClientes();
      generateNumero();
    }
  }, [isOpen]);

  const loadClientes = async () => {
    try {
      const { data } = await supabase
        .from("clientes")
        .select("id, nome")
        .eq("user_id", userId)
        .order("nome");
      setClientes((data as Cliente[]) || []);
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
    }
  };

  const generateNumero = () => {
    const now = new Date();
    const numero = `ORÇ-${now.getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
    setFormData((prev) => ({ ...prev, numero }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error: insertError } = await supabase
        .from("orcamentos")
        .insert([
          {
            user_id: userId,
            cliente_id: formData.cliente_id,
            numero: formData.numero,
            total: parseFloat(formData.total) || 0,
            data_vencimento: formData.data_vencimento || null,
            notas: formData.notas,
            status: "rascunho",
          },
        ]);

      if (insertError) throw insertError;

      setFormData({
        cliente_id: "",
        numero: "",
        total: "",
        data_vencimento: "",
        notas: "",
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar orçamento");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#0b1820",
          border: "1px solid rgba(19, 200, 211, 0.2)",
          borderRadius: "12px",
          padding: "2rem",
          width: "90%",
          maxWidth: "500px",
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#eaf3f8" }}>Novo Orçamento</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#8da2b4" }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "6px", padding: "12px", marginBottom: "1rem", color: "#ef5350", fontSize: "13px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem", fontWeight: 500 }}>Cliente *</label>
            <select
              name="cliente_id"
              value={formData.cliente_id}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "rgba(6, 34, 53, 0.8)",
                border: "1px solid rgba(19, 200, 211, 0.2)",
                borderRadius: "6px",
                color: "#eaf3f8",
                fontSize: "13px",
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem", fontWeight: 500 }}>Número</label>
              <input
                type="text"
                name="numero"
                value={formData.numero}
                readOnly
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "rgba(6, 34, 53, 0.5)",
                  border: "1px solid rgba(19, 200, 211, 0.2)",
                  borderRadius: "6px",
                  color: "#8da2b4",
                  fontSize: "13px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem", fontWeight: 500 }}>Total *</label>
              <input
                type="number"
                name="total"
                value={formData.total}
                onChange={handleChange}
                required
                step="0.01"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "rgba(6, 34, 53, 0.8)",
                  border: "1px solid rgba(19, 200, 211, 0.2)",
                  borderRadius: "6px",
                  color: "#eaf3f8",
                  fontSize: "13px",
                }}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem", fontWeight: 500 }}>Data de Vencimento</label>
            <input
              type="date"
              name="data_vencimento"
              value={formData.data_vencimento}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "rgba(6, 34, 53, 0.8)",
                border: "1px solid rgba(19, 200, 211, 0.2)",
                borderRadius: "6px",
                color: "#eaf3f8",
                fontSize: "13px",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem", fontWeight: 500 }}>Notas</label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "rgba(6, 34, 53, 0.8)",
                border: "1px solid rgba(19, 200, 211, 0.2)",
                borderRadius: "6px",
                color: "#eaf3f8",
                fontSize: "13px",
                minHeight: "80px",
                resize: "vertical",
              }}
              placeholder="Detalhes do orçamento..."
            />
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "10px 16px",
                background: "rgba(255,255,255,.035)",
                border: "1px solid rgba(255,255,255,.055)",
                borderRadius: "6px",
                color: "#d7e4ec",
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
                background: "linear-gradient(135deg, #0bd0d7, #08718b)",
                border: "none",
                borderRadius: "6px",
                color: "white",
                cursor: "pointer",
                fontWeight: 600,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Salvando..." : "Criar Orçamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
