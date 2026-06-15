import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";

interface ClienteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export function ClienteForm({ isOpen, onClose, onSuccess, userId }: ClienteFormProps) {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    empresa: "",
    cnpj_cpf: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from("clientes").insert([
        {
          ...formData,
          user_id: userId,
        },
      ]);

      if (insertError) throw insertError;

      setFormData({
        nome: "",
        email: "",
        telefone: "",
        empresa: "",
        cnpj_cpf: "",
        endereco: "",
        cidade: "",
        estado: "",
        cep: "",
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar cliente");
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
          <h2 style={{ margin: 0, fontSize: "20px" }}>Novo Cliente</h2>
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
              Nome *
            </label>
            <input
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
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
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              Telefone
            </label>
            <input
              type="tel"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
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
              Empresa
            </label>
            <input
              type="text"
              value={formData.empresa}
              onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
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
              CPF/CNPJ
            </label>
            <input
              type="text"
              value={formData.cnpj_cpf}
              onChange={(e) => setFormData({ ...formData, cnpj_cpf: e.target.value })}
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
              Endereço
            </label>
            <input
              type="text"
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem" }}>
                Cidade
              </label>
              <input
                type="text"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
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
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem" }}>
                Estado
              </label>
              <input
                type="text"
                maxLength={2}
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
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
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem" }}>
              CEP
            </label>
            <input
              type="text"
              value={formData.cep}
              onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
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
              {loading ? "Criando..." : "Criar Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
