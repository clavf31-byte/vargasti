import { jsPDF } from "jspdf";

interface OrcamentoItem {
  descricao: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  categoria?: string;
}

interface OrcamentoPDF {
  numero: string;
  cliente_nome: string;
  cliente_telefone?: string;
  cliente_endereco?: string;
  data_criacao: string;
  data_vencimento?: string;
  itens: OrcamentoItem[];
  total: number;
  status: string;
  desconto?: number;
  impostos?: number;
  approval_url?: string;
}

const EMPRESA = {
  nome: "VargasTI",
  telefone: "(51) 99880-8343",
  email: "suporte.vargasti@gmail.com",
  cnpj: "63.790.122/0001-49",
};

const C = {
  primary:   [11, 208, 215] as [number, number, number],
  dark:      [20, 30, 48]   as [number, number, number],
  gray:      [100, 116, 139] as [number, number, number],
  lightGray: [248, 250, 252] as [number, number, number],
  border:    [226, 232, 240] as [number, number, number],
  white:     [255, 255, 255] as [number, number, number],
  green:     [34, 197, 94]  as [number, number, number],
  red:       [239, 68, 68]  as [number, number, number],
};

function addPageIfNeeded(doc: jsPDF, y: number, needed: number, margin: number): number {
  if (y + needed > doc.internal.pageSize.getHeight() - 20) {
    doc.addPage();
    return margin;
  }
  return y;
}

export function gerarPDFOrcamento(orcamento: OrcamentoPDF) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const ml = 14;
  const mr = W - ml;
  const cw = mr - ml;

  let y = 0;

  // ── HEADER BAR ──────────────────────────────────────────────────────────────
  doc.setFillColor(...C.dark);
  doc.rect(0, 0, W, 28, "F");

  // Accent stripe
  doc.setFillColor(...C.primary);
  doc.rect(0, 24, W, 4, "F");

  // Company name
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.primary);
  doc.text(EMPRESA.nome, ml + 2, 15);

  // Company details (right)
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 200, 210);
  doc.text(EMPRESA.email, mr - 2, 10, { align: "right" });
  doc.text(EMPRESA.telefone, mr - 2, 15, { align: "right" });
  doc.text(`CNPJ: ${EMPRESA.cnpj}`, mr - 2, 20, { align: "right" });

  y = 35;

  // ── DOCUMENT TITLE + META ────────────────────────────────────────────────────
  // Left: quotation number
  doc.setFontSize(17);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text(`Orcamento #${orcamento.numero}`, ml, y + 6);

  // Status badge
  const statusLabel = {
    rascunho: "Rascunho",
    enviado:  "Enviado",
    aprovado: "Aprovado",
    rejeitado: "Rejeitado",
  }[orcamento.status] || orcamento.status;

  const statusColor = {
    rascunho:  C.gray,
    enviado:   C.primary,
    aprovado:  C.green,
    rejeitado: C.red,
  }[orcamento.status] || C.gray;

  doc.setFillColor(...(statusColor as [number, number, number]));
  doc.roundedRect(mr - 28, y, 28, 8, 2, 2, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.white);
  doc.text(statusLabel.toUpperCase(), mr - 14, y + 5.5, { align: "center" });

  y += 14;

  // Dates row
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.gray);
  doc.text(
    `Emitido em: ${new Date(orcamento.data_criacao).toLocaleDateString("pt-BR")}` +
    (orcamento.data_vencimento
      ? `     Valido ate: ${new Date(orcamento.data_vencimento).toLocaleDateString("pt-BR")}`
      : ""),
    ml, y
  );

  y += 10;

  // ── CLIENT BOX ───────────────────────────────────────────────────────────────
  doc.setFillColor(...C.lightGray);
  doc.setDrawColor(...C.border);
  doc.roundedRect(ml, y, cw, 22, 2, 2, "FD");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.primary);
  doc.text("CLIENTE", ml + 5, y + 6);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text(orcamento.cliente_nome, ml + 5, y + 13);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.gray);
  const clientDetails = [orcamento.cliente_telefone, orcamento.cliente_endereco]
    .filter(Boolean)
    .join("   |   ");
  if (clientDetails) doc.text(clientDetails, ml + 5, y + 19);

  y += 28;

  // ── ITEMS TABLE ──────────────────────────────────────────────────────────────
  const colW = {
    desc:   cw * 0.46,
    qty:    cw * 0.11,
    unit:   cw * 0.21,
    total:  cw * 0.22,
  };
  const colX = {
    desc:  ml,
    qty:   ml + colW.desc,
    unit:  ml + colW.desc + colW.qty,
    total: ml + colW.desc + colW.qty + colW.unit,
  };

  // Table header
  doc.setFillColor(...C.dark);
  doc.rect(ml, y, cw, 9, "F");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.white);
  doc.text("DESCRICAO", colX.desc + 3, y + 6);
  doc.text("QTD", colX.qty + 2, y + 6);
  doc.text("PRECO UNIT.", colX.unit + 2, y + 6);
  doc.text("SUBTOTAL", colX.total + colW.total - 2, y + 6, { align: "right" });

  y += 9;

  // Rows
  let subtotalCalc = 0;
  let shade = false;

  if (orcamento.itens.length === 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.gray);
    doc.text("Nenhum item adicionado", W / 2, y + 8, { align: "center" });
    y += 16;
  } else {
    for (const item of orcamento.itens) {
      const descLines = doc.splitTextToSize(item.descricao, colW.desc - 6);
      const rowH = Math.max(9, descLines.length * 4.8 + 4);

      y = addPageIfNeeded(doc, y, rowH + 2, ml);

      if (shade) {
        doc.setFillColor(...C.lightGray);
        doc.rect(ml, y, cw, rowH, "F");
      }
      shade = !shade;

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.dark);
      doc.text(descLines, colX.desc + 3, y + 5.5);
      doc.text(String(item.quantidade), colX.qty + 2, y + 5.5);
      doc.text(
        `R$ ${item.preco_unitario.toFixed(2).replace(".", ",")}`,
        colX.unit + 2, y + 5.5
      );
      doc.setFont("helvetica", "bold");
      doc.text(
        `R$ ${item.subtotal.toFixed(2).replace(".", ",")}`,
        colX.total + colW.total - 2, y + 5.5,
        { align: "right" }
      );
      doc.setFont("helvetica", "normal");

      subtotalCalc += item.subtotal;
      y += rowH;

      doc.setDrawColor(...C.border);
      doc.line(ml, y, mr, y);
    }
  }

  y += 6;

  // ── TOTALS ───────────────────────────────────────────────────────────────────
  const totX = ml + cw * 0.55;
  const totLabelX = totX;
  const totValueX = mr;

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.gray);
  doc.text("Subtotal:", totLabelX, y);
  doc.text(
    `R$ ${subtotalCalc.toFixed(2).replace(".", ",")}`,
    totValueX, y, { align: "right" }
  );
  y += 6;

  if (orcamento.desconto && orcamento.desconto > 0) {
    doc.setTextColor(...C.red);
    doc.text("Desconto:", totLabelX, y);
    doc.text(
      `- R$ ${orcamento.desconto.toFixed(2).replace(".", ",")}`,
      totValueX, y, { align: "right" }
    );
    y += 6;
  }

  if (orcamento.impostos && orcamento.impostos > 0) {
    doc.setTextColor(...C.gray);
    doc.text("Impostos:", totLabelX, y);
    doc.text(
      `+ R$ ${orcamento.impostos.toFixed(2).replace(".", ",")}`,
      totValueX, y, { align: "right" }
    );
    y += 6;
  }

  // Total highlight bar
  y += 2;
  doc.setFillColor(...C.dark);
  doc.roundedRect(totX - 4, y - 2, mr - totX + 6, 12, 2, 2, "F");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(200, 220, 225);
  doc.text("TOTAL", totLabelX, y + 7);
  doc.setTextColor(...C.primary);
  doc.text(
    `R$ ${orcamento.total.toFixed(2).replace(".", ",")}`,
    totValueX - 1, y + 7, { align: "right" }
  );

  y += 20;

  // ── APPROVAL BOX ─────────────────────────────────────────────────────────────
  if (orcamento.approval_url) {
    y = addPageIfNeeded(doc, y, 28, ml);

    doc.setFillColor(236, 254, 255);
    doc.setDrawColor(...C.primary);
    doc.roundedRect(ml, y, cw, 26, 2, 2, "FD");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.dark);
    doc.text("Aprovacao Online", ml + 5, y + 8);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.gray);
    doc.text("Acesse o link para aprovar ou recusar este orcamento:", ml + 5, y + 14);

    doc.setTextColor(...C.primary);
    const urlDisplay = orcamento.approval_url.length > 70
      ? orcamento.approval_url.substring(0, 70) + "..."
      : orcamento.approval_url;
    doc.text(urlDisplay, ml + 5, y + 20);

    y += 32;
  }

  // ── SIGNATURE LINE ───────────────────────────────────────────────────────────
  y = addPageIfNeeded(doc, y, 22, ml);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text("Aceite do Cliente", ml, y);

  y += 10;
  doc.setDrawColor(...C.border);
  doc.line(ml, y, ml + 80, y);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.gray);
  doc.text("Assinatura / Data", ml, y + 4);

  // ── FOOTER ───────────────────────────────────────────────────────────────────
  const footerY = H - 8;
  doc.setDrawColor(...C.border);
  doc.line(ml, footerY - 4, mr, footerY - 4);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.gray);
  doc.text(
    `${EMPRESA.nome}  |  ${EMPRESA.email}  |  ${EMPRESA.telefone}  |  CNPJ: ${EMPRESA.cnpj}`,
    W / 2, footerY,
    { align: "center" }
  );

  return doc;
}

export function baixarPDFOrcamento(orcamento: OrcamentoPDF) {
  const doc = gerarPDFOrcamento(orcamento);
  const date = new Date().toISOString().split("T")[0];
  doc.save(`VargasTI_Orcamento-${orcamento.numero}_${date}.pdf`);
}
