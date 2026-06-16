interface OrcamentoItem {
  descricao: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

interface OrcamentoPDF {
  numero: string;
  cliente_nome: string;
  data_criacao: string;
  data_vencimento?: string;
  itens: OrcamentoItem[];
  total: number;
  status: string;
}

export function gerarPDFOrcamento(orcamento: OrcamentoPDF) {
  const doc = new (window as any).jspdf.jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const tableWidth = pageWidth - 2 * margin;

  let yPosition = margin;

  // Header
  doc.setFontSize(20);
  doc.setFont(undefined, "bold");
  doc.text("ORÇAMENTO", pageWidth / 2, yPosition, { align: "center" });

  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text(`Número: ${orcamento.numero}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Status: ${orcamento.status.toUpperCase()}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Data: ${new Date(orcamento.data_criacao).toLocaleDateString("pt-BR")}`, margin, yPosition);
  if (orcamento.data_vencimento) {
    yPosition += 6;
    doc.text(
      `Vencimento: ${new Date(orcamento.data_vencimento).toLocaleDateString("pt-BR")}`,
      margin,
      yPosition
    );
  }

  yPosition += 12;
  doc.setFont(undefined, "bold");
  doc.text(`Cliente: ${orcamento.cliente_nome}`, margin, yPosition);

  yPosition += 15;

  // Table Header
  const columns = ["Descrição", "Quantidade", "Preço Unit.", "Subtotal"];
  const colWidths = [tableWidth * 0.5, tableWidth * 0.15, tableWidth * 0.15, tableWidth * 0.2];

  doc.setFontSize(9);
  doc.setFont(undefined, "bold");
  doc.setFillColor(200, 200, 200);

  let xPosition = margin;
  for (let i = 0; i < columns.length; i++) {
    doc.rect(xPosition, yPosition - 4, colWidths[i], 6, "F");
    doc.text(columns[i], xPosition + 2, yPosition, { align: "left" });
    xPosition += colWidths[i];
  }

  yPosition += 8;
  doc.setFont(undefined, "normal");

  // Table Rows
  for (const item of orcamento.itens) {
    if (yPosition > pageHeight - 20) {
      doc.addPage();
      yPosition = margin;
    }

    xPosition = margin;
    doc.setFontSize(8);

    const descricaoLines = doc.splitTextToSize(item.descricao, colWidths[0] - 2);
    const rowHeight = Math.max(4, descricaoLines.length * 3);

    doc.text(descricaoLines, xPosition + 2, yPosition);
    xPosition += colWidths[0];

    doc.text(item.quantidade.toString(), xPosition + 2, yPosition, { align: "right" });
    xPosition += colWidths[1];

    doc.text(`R$ ${item.preco_unitario.toFixed(2)}`, xPosition + 2, yPosition, { align: "right" });
    xPosition += colWidths[2];

    doc.text(`R$ ${item.subtotal.toFixed(2)}`, xPosition + 2, yPosition, { align: "right" });

    yPosition += rowHeight + 2;
  }

  // Total
  yPosition += 5;
  const totalX = margin + tableWidth - colWidths[3];
  doc.setFont(undefined, "bold");
  doc.setFontSize(10);
  doc.text("TOTAL:", totalX - 30, yPosition, { align: "right" });
  doc.text(`R$ ${orcamento.total.toFixed(2)}`, totalX + colWidths[3] - 2, yPosition, { align: "right" });

  // Footer
  yPosition = pageHeight - 15;
  doc.setFontSize(8);
  doc.setFont(undefined, "normal");
  doc.text("VargasTI - Sistema de Orçamentos", pageWidth / 2, yPosition, { align: "center" });

  return doc;
}

export function baixarPDFOrcamento(orcamento: OrcamentoPDF) {
  const doc = gerarPDFOrcamento(orcamento);
  doc.save(`orcamento-${orcamento.numero}.pdf`);
}
