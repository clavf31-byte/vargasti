import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useServicos } from "@/hooks/useServicos";
import { usePecas } from "@/hooks/usePecas";
import { colors, spacing, borderRadius } from "@/lib/colors";
import { X, Plus } from "lucide-react";

interface OrcamentoItem {
  descricao: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  categoria?: string;
  tipo?: "servico" | "peca";
  servico_id?: string;
  peca_id?: string;
}

interface OrcamentoItemFormProps {
  onAdd: (item: OrcamentoItem) => void;
  onClose: () => void;
}

export function OrcamentoItemForm({ onAdd, onClose }: OrcamentoItemFormProps) {
  const { user } = useAuth();
  const { servicos, loadServicos: refetchServicos } = useServicos(user?.id);
  const { pecas, loadPecas: refetchPecas } = usePecas(user?.id);

  const [tipo, setTipo] = useState<"servico" | "peca">("servico");
  const [selecionado, setSelecionado] = useState<any>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [precoCustomizado, setPrecoCustomizado] = useState(false);
  const [preco, setPreco] = useState(0);

  const [showNewForm, setShowNewForm] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoPreco, setNovoPreco] = useState(0);
  const [novoDescricao, setNovoDescricao] = useState("");
  const [creatingNew, setCreatingNew] = useState(false);

  useEffect(() => {
    if (tipo === "servico" && servicos.length > 0) {
      setSelecionado(servicos[0]);
      setPreco(servicos[0].valor_padrao);
    } else if (tipo === "peca" && pecas.length > 0) {
      setSelecionado(pecas[0]);
      setPreco(pecas[0].valor_venda);
    }
  }, [tipo, servicos, pecas]);

  async function handleCreateNew() {
    if (!novoNome.trim() || novoPreco <= 0) {
      alert("Preencha todos os campos");
      return;
    }

    setCreatingNew(true);
    try {
      if (tipo === "servico") {
        const { data } = await supabase.from("servicos").insert([
          {
            user_id: user!.id,
            nome: novoNome,
            valor_padrao: novoPreco,
            descricao: novoDescricao,
            ativo: true,
            unidade: "h",
            categoria: "Geral",
          },
        ]).select();

        if (data && data[0]) {
          setSelecionado(data[0]);
          setPreco(data[0].valor_padrao);
          setShowNewForm(false);
          await refetchServicos?.();
        }
      } else {
        const { data } = await supabase.from("pecas").insert([
          {
            user_id: user!.id,
            codigo: `PEC-${Date.now()}`,
            descricao: novoNome,
            categoria: novoDescricao || "Geral",
            valor_venda: novoPreco,
            valor_custo: novoPreco * 0.6,
            ativo: true,
          },
        ]).select();

        if (data && data[0]) {
          setSelecionado(data[0]);
          setPreco(data[0].valor_venda);
          setShowNewForm(false);
          await refetchPecas?.();
        }
      }

      setNovoNome("");
      setNovoPreco(0);
      setNovoDescricao("");
    } catch (err) {
      alert("Erro ao criar: " + (err instanceof Error ? err.message : "Desconhecido"));
    } finally {
      setCreatingNew(false);
    }
  }

  function handleAdd() {
    if (!selecionado) return;

    const item: OrcamentoItem = {
      descricao: selecionado.nome || selecionado.descricao,
      quantidade,
      preco_unitario: precoCustomizado ? preco : (tipo === "servico" ? selecionado.valor_padrao : selecionado.valor_venda),
      subtotal: quantidade * (precoCustomizado ? preco : (tipo === "servico" ? selecionado.valor_padrao : selecionado.valor_venda)),
      categoria: tipo === "servico" ? "Serviços" : "Produtos, peças e materiais",
      tipo,
      servico_id: tipo === "servico" ? selecionado.id : undefined,
      peca_id: tipo === "peca" ? selecionado.id : undefined,
    };

    onAdd(item);
    onClose();
  }

  const inputStyle = {
    width: "100%",
    padding: spacing.md,
    background: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    color: colors.text,
    fontSize: "14px",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block" as const,
    fontSize: "14px",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: 600 as const,
  };

  const listaItens = tipo === "servico" ? servicos : pecas;
  const precoFieldLabel = tipo === "servico" ? "Valor Padrão" : "Valor de Venda";

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
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: colors.backgroundSecondary,
          border: `1px solid ${colors.border}`,
          borderRadius: borderRadius.lg,
          padding: "2rem",
          maxWidth: "500px",
          width: "90%",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: spacing.lg,
          }}
        >
          <h3 style={{ margin: 0, color: colors.text, fontSize: "18px", fontWeight: 600 }}>
            Adicionar Item
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: colors.textSecondary,
              fontSize: "24px",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Tipo de Item */}
        <div style={{ marginBottom: spacing.lg }}>
          <label style={labelStyle}>Tipo de Item *</label>
          <div style={{ display: "flex", gap: spacing.md }}>
            <button
              type="button"
              onClick={() => {
                setTipo("servico");
                setSelecionado(null);
              }}
              style={{
                flex: 1,
                padding: spacing.md,
                background: tipo === "servico" ? colors.primary : "transparent",
                border: `1px solid ${tipo === "servico" ? colors.primary : colors.border}`,
                borderRadius: borderRadius.md,
                color: tipo === "servico" ? "#fff" : colors.text,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Serviço
            </button>
            <button
              type="button"
              onClick={() => {
                setTipo("peca");
                setSelecionado(null);
              }}
              style={{
                flex: 1,
                padding: spacing.md,
                background: tipo === "peca" ? colors.primary : "transparent",
                border: `1px solid ${tipo === "peca" ? colors.primary : colors.border}`,
                borderRadius: borderRadius.md,
                color: tipo === "peca" ? "#fff" : colors.text,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Peça/Material
            </button>
          </div>
        </div>

        {/* Seleção de Item */}
        {showNewForm ? (
          <div style={{ marginBottom: spacing.lg }}>
            <label style={labelStyle}>
              {tipo === "servico" ? "Nome do Serviço" : "Descrição da Peça"} *
            </label>
            <input
              type="text"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder={tipo === "servico" ? "Ex: Suporte Técnico" : "Ex: Memória RAM 8GB"}
              style={inputStyle}
              autoFocus
            />

            <label style={{ ...labelStyle, marginTop: spacing.lg }}>
              {tipo === "servico" ? "Valor Padrão" : "Valor de Venda"} *
            </label>
            <input
              type="number"
              value={novoPreco}
              onChange={(e) => setNovoPreco(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              style={inputStyle}
            />

            <label style={{ ...labelStyle, marginTop: spacing.lg }}>
              {tipo === "servico" ? "Descrição" : "Categoria"}
            </label>
            <input
              type="text"
              value={novoDescricao}
              onChange={(e) => setNovoDescricao(e.target.value)}
              placeholder={tipo === "servico" ? "Descrição do serviço" : "Ex: Hardware"}
              style={inputStyle}
            />

            <div style={{ display: "flex", gap: spacing.md, marginTop: spacing.lg }}>
              <button
                type="button"
                onClick={() => {
                  setShowNewForm(false);
                  setNovoNome("");
                  setNovoPreco(0);
                  setNovoDescricao("");
                }}
                style={{
                  flex: 1,
                  padding: spacing.md,
                  background: "transparent",
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.md,
                  color: colors.text,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateNew}
                disabled={creatingNew}
                style={{
                  flex: 1,
                  padding: spacing.md,
                  background: colors.primary,
                  border: "none",
                  borderRadius: borderRadius.md,
                  color: "#fff",
                  cursor: creatingNew ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  opacity: creatingNew ? 0.6 : 1,
                }}
              >
                {creatingNew ? "Criando..." : "Criar e Usar"}
              </button>
            </div>
          </div>
        ) : listaItens.length === 0 ? (
          <div style={{ marginBottom: spacing.lg }}>
            <button
              type="button"
              onClick={() => setShowNewForm(true)}
              style={{
                width: "100%",
                padding: spacing.lg,
                background: colors.primary,
                border: "none",
                borderRadius: borderRadius.md,
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.sm,
              }}
            >
              <Plus size={18} />
              Criar {tipo === "servico" ? "Novo Serviço" : "Nova Peça"}
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: spacing.lg }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>
                {tipo === "servico" ? "Serviço" : "Peça/Material"} *
              </label>
              <button
                type="button"
                onClick={() => setShowNewForm(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: colors.primary,
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Plus size={14} /> Novo
              </button>
            </div>
            <select
              value={selecionado?.id || ""}
              onChange={(e) => {
                const item: any = (listaItens as any[]).find((i) => i.id === e.target.value);
                setSelecionado(item);
                if (item) {
                  setPreco(tipo === "servico" ? item.valor_padrao : item.valor_venda);
                  setPrecoCustomizado(false);
                }
              }}
              style={inputStyle}
            >
              <option value="">Selecione...</option>
              {(listaItens as any[]).map((item) => (
                <option key={item.id} value={item.id}>
                  {tipo === "servico" ? item.nome : `[${item.codigo}] ${item.descricao}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {selecionado && (
          <>
            {/* Descrição (leitura) */}
            <div style={{ marginBottom: spacing.lg }}>
              <label style={labelStyle}>Descrição</label>
              <div
                style={{
                  padding: spacing.md,
                  background: colors.background,
                  borderRadius: borderRadius.md,
                  color: colors.text,
                  fontSize: "14px",
                }}
              >
                {tipo === "servico"
                  ? selecionado.descricao || "Sem descrição"
                  : `${selecionado.categoria} - ${selecionado.fabricante || "S/M"}`}
              </div>
            </div>

            {/* Quantidade */}
            <div style={{ marginBottom: spacing.lg }}>
              <label style={labelStyle}>Quantidade *</label>
              <input
                type="number"
                value={quantidade}
                onChange={(e) => setQuantidade(parseFloat(e.target.value) || 1)}
                min="1"
                step={tipo === "servico" ? "0.5" : "1"}
                style={inputStyle}
              />
              {tipo === "servico" && (
                <div style={{ fontSize: "12px", color: colors.textSecondary, marginTop: spacing.sm }}>
                  Unidade: {selecionado.unidade}
                </div>
              )}
            </div>

            {/* Preço */}
            <div style={{ marginBottom: spacing.lg }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>{precoFieldLabel}</label>
                <button
                  type="button"
                  onClick={() => setPrecoCustomizado(!precoCustomizado)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: colors.primary,
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {precoCustomizado ? "Usar Padrão" : "Customizar"}
                </button>
              </div>
              <input
                type="number"
                value={preco}
                onChange={(e) => setPreco(parseFloat(e.target.value) || 0)}
                step="0.01"
                disabled={!precoCustomizado}
                style={{
                  ...inputStyle,
                  opacity: precoCustomizado ? 1 : 0.6,
                  cursor: precoCustomizado ? "text" : "not-allowed",
                }}
              />
            </div>

            {/* Subtotal */}
            <div
              style={{
                padding: spacing.lg,
                background: "rgba(13, 208, 215, 0.05)",
                border: `1px solid rgba(13, 208, 215, 0.2)`,
                borderRadius: borderRadius.md,
                marginBottom: spacing.lg,
              }}
            >
              <div style={{ fontSize: "12px", color: colors.textSecondary, marginBottom: spacing.sm }}>
                Subtotal: {quantidade} × R$ {preco.toFixed(2)}
              </div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: colors.primary }}>
                R$ {(quantidade * preco).toFixed(2)}
              </div>
            </div>

            {/* Botões */}
            <div style={{ display: "flex", gap: spacing.md }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: "transparent",
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.md,
                  color: colors.text,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAdd}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: colors.primary,
                  border: "none",
                  borderRadius: borderRadius.md,
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Adicionar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
