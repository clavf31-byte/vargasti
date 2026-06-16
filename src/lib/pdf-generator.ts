interface OrcamentoItem {
  descricao: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  categoria?: string;
}

interface ClienteInfo {
  nome: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
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
}

const CORES = {
  primary: [11, 208, 215],
  dark: [31, 41, 55],
  light: [243, 244, 246],
  border: [229, 231, 235],
  servicos: [59, 130, 246],
  produtos: [16, 185, 129],
  success: [34, 197, 94],
};

const EMPRESA = {
  nome: "VargasTI",
  telefone: "(51) 99880-8343",
  email: "suporte.vargasti@gmail.com",
  cnpj: "63.790.122/0001-49",
};

function categorizarItens(itens: OrcamentoItem[]) {
  const categorias: { [key: string]: OrcamentoItem[] } = {};

  for (const item of itens) {
    const cat = item.categoria || "Produtos, peças e materiais";
    if (!categorias[cat]) categorias[cat] = [];
    categorias[cat].push(item);
  }

  return categorias;
}

export function gerarPDFOrcamento(orcamento: OrcamentoPDF) {
  const doc = new (window as any).jspdf.jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  const contentWidth = pageWidth - 2 * margin;

  let yPosition = margin;

  // === CABEÇALHO COM DADOS DA EMPRESA ===
  doc.setFillColor(...CORES.light);
  doc.rect(margin, yPosition, contentWidth, 20, "F");

  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...CORES.primary);
  doc.text(EMPRESA.nome, margin + 5, yPosition + 8);

  doc.setFontSize(8);
  doc.setFont(undefined, "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(EMPRESA.telefone, margin + 5, yPosition + 13);
  doc.text(EMPRESA.email, margin + 5, yPosition + 17);
  doc.text(`CNPJ: ${EMPRESA.cnpj}`, contentWidth - 35, yPosition + 13);

  yPosition += 25;

  // === INFORMAÇÕES: EMPRESA vs CLIENTE ===
  const halfWidth = (contentWidth - 5) / 2;

  // Empresa (lado esquerdo)
  doc.setFontSize(9);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...CORES.dark);
  doc.text("VargasTI", margin, yPosition);

  doc.setFontSize(8);
  doc.setFont(undefined, "normal");
  yPosition += 5;
  doc.text(`📞 ${EMPRESA.telefone}`, margin, yPosition);
  yPosition += 4;
  doc.text(`✉ ${EMPRESA.email}`, margin, yPosition);
  yPosition += 4;
  doc.text(`🏢 ${EMPRESA.cnpj}`, margin, yPosition);

  // Cliente (lado direito)
  yPosition -= 12;
  doc.setFontSize(9);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...CORES.dark);
  doc.text(orcamento.cliente_nome, margin + halfWidth + 5, yPosition);

  doc.setFontSize(8);
  doc.setFont(undefined, "normal");
  yPosition += 5;
  if (orcamento.cliente_telefone) {
    doc.text(`📞 ${orcamento.cliente_telefone}`, margin + halfWidth + 5, yPosition);
    yPosition += 4;
  }
  if (orcamento.cliente_endereco) {
    doc.text(`📍 ${orcamento.cliente_endereco}`, margin + halfWidth + 5, yPosition);
    yPosition += 4;
  }

  yPosition += 10;

  // === NÚMERO E DATA DO ORÇAMENTO ===
  doc.setFillColor(...CORES.primary);
  doc.rect(margin, yPosition, contentWidth, 8, "F");

  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(`Orçamento #${orcamento.numero}`, pageWidth / 2, yPosition + 5, { align: "center" });

  yPosition += 12;

  // Data de emissão
  doc.setFontSize(8);
  doc.setFont(undefined, "normal");
  doc.setTextColor(...CORES.dark);
  doc.text("Emitido em:", margin, yPosition);
  doc.setFont(undefined, "bold");
  doc.text(new Date(orcamento.data_criacao).toLocaleDateString("pt-BR"), margin + 20, yPosition);

  yPosition += 8;

  // === ITENS DO ORÇAMENTO ===
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...CORES.dark);
  doc.text("Itens do Orçamento", margin, yPosition);

  yPosition += 8;

  const categorias = categorizarItens(orcamento.itens);
  let subtotal = 0;

  for (const [categoria, itens] of Object.entries(categorias)) {
    // Cabeçalho da categoria
    doc.setFontSize(9);
    doc.setFont(undefined, "bold");
    doc.setTextColor(...CORES.primary);
    doc.text(categoria, margin + 3, yPosition);
    yPosition += 5;

    // Itens da categoria
    doc.setFontSize(8);
    doc.setFont(undefined, "normal");
    doc.setTextColor(...CORES.dark);

    for (const item of itens) {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }

      // Descrição
      const descLines = doc.splitTextToSize(item.descricao, contentWidth - 50);
      const lineHeight = 4;
      const itemHeight = Math.max(4, descLines.length * lineHeight);

      doc.text(descLines, margin + 5, yPosition);

      // Quantidade e preço na mesma linha
      const qtdText = `${item.quantidade}x R$ ${item.preco_unitario.toFixed(2)} (un)`;
      doc.text(qtdText, contentWidth - 35, yPosition);

      // Subtotal
      doc.setFont(undefined, "bold");
      doc.text(`R$ ${item.subtotal.toFixed(2)}`, contentWidth - 2, yPosition, { align: "right" });
      doc.setFont(undefined, "normal");

      yPosition += itemHeight + 2;
      subtotal += item.subtotal;
    }

    yPosition += 3;
  }

  // === TOTALIZAÇÕES ===
  yPosition += 5;

  // Linha separadora
  doc.setDrawColor(...CORES.border);
  doc.line(margin, yPosition, contentWidth, yPosition);
  yPosition += 5;

  // Subtotal
  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.setTextColor(...CORES.dark);
  doc.text("Subtotal", margin, yPosition);
  doc.text(`R$ ${subtotal.toFixed(2)}`, contentWidth, yPosition, { align: "right" });

  yPosition += 8;

  // Total (destaque)
  doc.setFillColor(...CORES.light);
  doc.rect(margin, yPosition - 4, contentWidth, 10, "F");

  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...CORES.dark);
  doc.text("Total", margin + 3, yPosition + 2);

  doc.setTextColor(...CORES.primary);
  doc.text(`R$ ${orcamento.total.toFixed(2)}`, contentWidth - 3, yPosition + 2, { align: "right" });

  yPosition += 15;

  // === SEÇÃO DE AÇÃO ===
  doc.setFillColor(...CORES.light);
  doc.rect(margin, yPosition, contentWidth, 20, "F");

  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...CORES.dark);
  doc.text("Aprovar Orçamento", margin + 3, yPosition + 5);

  doc.setFontSize(8);
  doc.setFont(undefined, "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Tudo certo? Solicite alterações se necessário ou aprove este orçamento.", margin + 3, yPosition + 10);
  doc.text("Botões: Solicitar alterações | Aprovar Orçamento", margin + 3, yPosition + 15);

  // === RODAPÉ ===
  doc.setFontSize(7);
  doc.setFont(undefined, "normal");
  doc.setTextColor(150, 150, 150);
  const dataHora = new Date(orcamento.data_criacao).toLocaleString("pt-BR");
  doc.text(`Orçamento emitido em ${dataHora}`, pageWidth / 2, pageHeight - 5, { align: "center" });

  return doc;
}

export function baixarPDFOrcamento(orcamento: OrcamentoPDF) {
  const doc = gerarPDFOrcamento(orcamento);
  doc.save(`VargasTI_${orcamento.cliente_nome}_Orcamento-${orcamento.numero}_${new Date().toISOString().split("T")[0]}.pdf`);
}
