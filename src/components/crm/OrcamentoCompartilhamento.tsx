import { useState } from "react";
import { Copy, X, Mail, MessageCircle, Share2, Download } from "lucide-react";
import QRCode from "qrcode.react";
import { useOrcamentoCompartilhamento } from "@/hooks/useOrcamentoCompartilhamento";

interface OrcamentoCompartilhamentoProps {
  orcamento: {
    id: string;
    numero_formatado: string;
    total: number;
  };
  cliente: {
    id: string;
    nome: string;
    email?: string;
    telefone?: string;
  };
  approvalUrl: string;
  onClose: () => void;
  onCompartilhado?: (canal: string) => void;
}

export function OrcamentoCompartilhamento({
  orcamento,
  cliente,
  approvalUrl,
  onClose,
  onCompartilhado,
}: OrcamentoCompartilhamentoProps) {
  const [copying, setCopying] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const {
    rastrearCompartilhamento,
    gerarMensagemProfissional,
    construirUrlWhatsApp,
    construirUrlSMS,
  } = useOrcamentoCompartilhamento();

  const mensagemProfissional = gerarMensagemProfissional(
    cliente.nome,
    orcamento.numero_formatado,
    orcamento.total,
    approvalUrl
  );

  async function handleCompartilhar(canal: "whatsapp" | "sms" | "email") {
    setActionLoading(true);
    try {
      await rastrearCompartilhamento(orcamento.id, cliente.id, canal);

      if (canal === "whatsapp") {
        const urlWA = construirUrlWhatsApp(
          cliente.nome,
          orcamento.numero_formatado,
          orcamento.total,
          approvalUrl,
          cliente.telefone
        );
        window.open(urlWA, "_blank");
      } else if (canal === "sms") {
        const urlSMS = construirUrlSMS(
          cliente.nome,
          orcamento.numero_formatado,
          approvalUrl,
          cliente.telefone
        );
        window.open(urlSMS, "_blank");
      } else if (canal === "email") {
        const assunto = `Orçamento #${orcamento.numero_formatado} - VargasTI`;
        const corpo = encodeURIComponent(mensagemProfissional);
        const urlEmail = `mailto:${cliente.email}?subject=${encodeURIComponent(assunto)}&body=${corpo}`;
        window.open(urlEmail, "_blank");
      }

      onCompartilhado?.(canal);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCopiar() {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(approvalUrl);
      setTimeout(() => setCopying(false), 2000);
    } catch {
      setCopying(false);
    }
  }

  function downloadQRCode() {
    const qrElement = document.getElementById("qrcode-orcamento");
    if (qrElement) {
      const canvas = qrElement.querySelector("canvas");
      if (canvas) {
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `orcamento-${orcamento.numero_formatado}-qrcode.png`;
        link.click();
      }
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
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#1a2332",
          borderRadius: "12px",
          padding: "2rem",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "90vh",
          overflow: "auto",
          border: "1px solid rgba(13, 208, 215, 0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ margin: 0, color: "#fff", fontSize: "18px", fontWeight: 700 }}>
            Compartilhar Orçamento
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#8da2b4",
              cursor: "pointer",
              fontSize: "20px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <p style={{ color: "#8da2b4", fontSize: "12px", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            QR Code para Aprovação
          </p>
          <div
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "1rem",
              textAlign: "center",
              marginBottom: "1rem",
            }}
            id="qrcode-orcamento"
          >
            <QRCode value={approvalUrl} size={200} level="H" includeMargin={true} />
          </div>
          <button
            onClick={downloadQRCode}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px",
              background: "rgba(13, 208, 215, 0.1)",
              border: "1px solid rgba(13, 208, 215, 0.3)",
              borderRadius: "6px",
              color: "#0bd0d7",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "13px",
            }}
          >
            <Download size={14} />
            Baixar QR Code
          </button>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <p style={{ color: "#8da2b4", fontSize: "12px", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            Link Direto
          </p>
          <code
            style={{
              display: "block",
              padding: "12px",
              background: "rgba(0, 0, 0, 0.2)",
              borderRadius: "6px",
              color: "#0bd0d7",
              fontSize: "12px",
              wordBreak: "break-all",
              marginBottom: "0.5rem",
            }}
          >
            {approvalUrl}
          </code>
          <button
            onClick={handleCopiar}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px",
              background: "#0bd0d7",
              border: "none",
              borderRadius: "6px",
              color: "#000",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "13px",
            }}
          >
            <Copy size={14} />
            {copying ? "Copiado!" : "Copiar Link"}
          </button>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <p style={{ color: "#8da2b4", fontSize: "12px", textTransform: "uppercase", marginBottom: "1rem" }}>
            Compartilhar Via
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {cliente.telefone && (
              <button
                onClick={() => handleCompartilhar("whatsapp")}
                disabled={actionLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px",
                  background: "#25d366",
                  border: "none",
                  borderRadius: "6px",
                  color: "white",
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: "13px",
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                <MessageCircle size={14} />
                WhatsApp
              </button>
            )}
            {cliente.email && (
              <button
                onClick={() => handleCompartilhar("email")}
                disabled={actionLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px",
                  background: "rgba(59, 130, 246, 0.2)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  borderRadius: "6px",
                  color: "#3b82f6",
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: "13px",
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                <Mail size={14} />
                Email
              </button>
            )}
            {cliente.telefone && (
              <button
                onClick={() => handleCompartilhar("sms")}
                disabled={actionLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px",
                  background: "rgba(168, 85, 247, 0.2)",
                  border: "1px solid rgba(168, 85, 247, 0.3)",
                  borderRadius: "6px",
                  color: "#a855f7",
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: "13px",
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                <Share2 size={14} />
                SMS
              </button>
            )}
          </div>
        </div>

        <div style={{ background: "rgba(13, 208, 215, 0.05)", borderRadius: "6px", padding: "1rem" }}>
          <p style={{ color: "#8da2b4", fontSize: "11px", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            Prévia da Mensagem
          </p>
          <p
            style={{
              color: "#eaf3f8",
              fontSize: "12px",
              whiteSpace: "pre-wrap",
              margin: 0,
              lineHeight: "1.5",
            }}
          >
            {mensagemProfissional}
          </p>
        </div>
      </div>
    </div>
  );
}
