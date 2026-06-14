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
    cnpj_cpf: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error: insertError } = await supabase
        .from("clientes")
        .insert([{ ...formData, user_id: userId }]);

      if (insertError) throw insertError;

      setFormData({
        nome: "",
        email: "",
        telefone: "",
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
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#eaf3f8" }}>Novo Cliente</h2>
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
            <label style={{ display: "block", fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem", fontWeight: 500 }}>Nome *</label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
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
              placeholder="Nome completo ou razão social"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem", fontWeight: 500 }}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
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
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem", fontWeight: 500 }}>Telefone</label>
              <input
                type="tel"
                name="telefone"
                value={formData.telefone}
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
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem", fontWeight: 500 }}>CPF/CNPJ</label>
            <input
              type="text"
              name="cnpj_cpf"
              value={formData.cnpj_cpf}
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
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem", fontWeight: 500 }}>Endereço</label>
            <input
              type="text"
              name="endereco"
              value={formData.endereco}
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
              placeholder="Rua, número, complemento"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem", fontWeight: 500 }}>Cidade</label>
              <input
                type="text"
                name="cidade"
                value={formData.cidade}
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
                placeholder="Cidade"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem", fontWeight: 500 }}>UF</label>
              <input
                type="text"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                maxLength={2}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "rgba(6, 34, 53, 0.8)",
                  border: "1px solid rgba(19, 200, 211, 0.2)",
                  borderRadius: "6px",
                  color: "#eaf3f8",
                  fontSize: "13px",
                }}
                placeholder="SP"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#8da2b4", marginBottom: "0.5rem", fontWeight: 500 }}>CEP</label>
              <input
                type="text"
                name="cep"
                value={formData.cep}
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
                placeholder="00000-000"
              />
            </div>
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
              {loading ? "Salvando..." : "Criar Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
