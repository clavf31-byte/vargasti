import { useState, useRef } from "react";
import { Copy, X, Mail, MessageCircle, Share2, Download, FileText } from "lucide-react";
import QRCode from "qrcode.react";

interface ContratoCompartilhamentoProps {
  contrato: {
    id: string;
    titulo: string;
    conteudo?: string;
  };
  cliente: {
    nome: string;
    email?: string;
    telefone?: string;
  };
  shareUrl: string;
  onClose: () => void;
}

export function ContratoCompartilhamento({
  contrato,
  cliente,
  shareUrl,
  onClose,
}: ContratoCompartilhamentoProps) {
  const [copying, setCopying] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleCopiar = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setTimeout(() => setCopying(false), 2000);
    } catch {
      setCopying(false);
    }
  };

  const handleCompartilhar = (canal: "whatsapp" | "email") => {
    setActionLoading(true);
    try {
      const mensagem = `Olá ${cliente.nome}!\n\nSeu contrato "${contrato.titulo}" está pronto para revisão.\n\nClique no link abaixo para visualizar:\n\n${shareUrl}\n\nAtenciosamente,\nVargasTI`;

      if (canal === "whatsapp" && cliente.telefone) {
        const urlWA = `https://wa.me/${cliente.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(mensagem)}`;
        window.open(urlWA, "_blank");
      } else if (canal === "email" && cliente.email) {
        const assunto = `Seu Contrato: ${contrato.titulo}`;
        const corpo = encodeURIComponent(mensagem);
        const urlEmail = `mailto:${cliente.email}?subject=${encodeURIComponent(assunto)}&body=${corpo}`;
        window.open(urlEmail, "_blank");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const downloadQRCode = () => {
    const qrElement = document.getElementById("qrcode-contrato");
    if (qrElement) {
      const canvas = qrElement.querySelector("canvas");
      if (canvas) {
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `contrato-${contrato.titulo}-qrcode.png`;
        link.click();
      }
    }
  };

  const downloadPDF = () => {
    setActionLoading(true);
    try {
      const printWindow = window.open("", "", "height=400,width=800");
      if (!printWindow) {
        alert("Por favor, desabilite o bloqueador de pop-ups para gerar PDF");
        setActionLoading(false);
        return;
      }

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${contrato.titulo}</title>
            <style>
              body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; margin: 40px; }
              h1 { text-align: center; margin-bottom: 10px; font-size: 24px; }
              .meta { text-align: center; color: #666; margin-bottom: 30px; border-bottom: 1px solid #ddd; padding-bottom: 20px; }
              .content { white-space: pre-wrap; margin-top: 30px; font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.5; }
              p { margin: 5px 0; }
            </style>
          </head>
          <body>
            <h1>${contrato.titulo}</h1>
            <div class="meta">
              <p><strong>Cliente:</strong> ${cliente.nome}</p>
              <p><strong>Gerado em:</strong> ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
            </div>
            <div class="content">${(contrato.conteudo || "Conteúdo não disponível").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
          </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.print();
        setActionLoading(false);
      }, 250);
    } catch (e) {
      console.error("Erro ao gerar PDF:", e);
      alert("Erro ao gerar PDF. Verifique o console.");
      setActionLoading(false);
    }
  };

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
            Compartilhar Contrato
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
            QR Code
          </p>
          <div
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "1rem",
              textAlign: "center",
              marginBottom: "1rem",
            }}
            id="qrcode-contrato"
          >
            <QRCode value={shareUrl} size={200} level="H" includeMargin={true} />
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
            {shareUrl}
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
            Download
          </p>
          <button
            onClick={downloadPDF}
            disabled={actionLoading}
            style={{
              width: "100%",
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
              marginBottom: "1rem",
            }}
          >
            <FileText size={14} />
            {actionLoading ? "Gerando PDF..." : "Baixar PDF"}
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
          </div>
        </div>

        <div style={{ background: "rgba(13, 208, 215, 0.05)", borderRadius: "6px", padding: "1rem" }}>
          <p style={{ color: "#8da2b4", fontSize: "11px", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            Informações
          </p>
          <p
            style={{
              color: "#eaf3f8",
              fontSize: "12px",
              margin: 0,
              lineHeight: "1.5",
            }}
          >
            Compartilhe este link com o cliente para que ele possa visualizar e acompanhar o contrato.
          </p>
        </div>
      </div>
    </div>
  );
}
