import { supabase } from "@/integrations/supabase/client";

interface CompartilhamentoData {
  orcamento_id: string;
  cliente_id: string;
  canal: "whatsapp" | "email" | "sms" | "qrcode";
  status: "enviado" | "visualizado" | "clicado" | "aprovado" | "rejeitado";
  enviado_em?: string;
  visualizado_em?: string;
  clicado_em?: string;
}

export function useOrcamentoCompartilhamento() {
  async function rastrearCompartilhamento(
    orcamentoId: string,
    clienteId: string,
    canal: "whatsapp" | "email" | "sms" | "qrcode"
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from("orcamento_compartilhamento").insert({
        orcamento_id: orcamentoId,
        cliente_id: clienteId,
        canal,
        status: "enviado",
        enviado_em: new Date().toISOString(),
      });

      if (error) throw error;
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erro ao registrar compartilhamento",
      };
    }
  }

  function gerarMensagemProfissional(
    clienteNome: string,
    numeroOrcamento: string,
    valorTotal: number,
    approvalUrl: string,
    empresaNome: string = "VargasTI",
    diasValidade: number = 7
  ): string {
    const dataVencimento = new Date();
    dataVencimento.setDate(dataVencimento.getDate() + diasValidade);
    const dataFormatada = dataVencimento.toLocaleDateString("pt-BR");

    return `Olá ${clienteNome} 👋

Seu orçamento está pronto! ✅

*Número:* #${numeroOrcamento}
*Valor:* R$ ${valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
*Válido até:* ${dataFormatada}

Clique no link abaixo para revisar e aprovar:
${approvalUrl}

Se tiver dúvidas, é só chamar! 😊

${empresaNome}`;
  }

  function construirUrlWhatsApp(
    clienteNome: string,
    numeroOrcamento: string,
    valorTotal: number,
    approvalUrl: string,
    clienteTelefone?: string,
    empresaNome?: string
  ): string {
    const mensagem = gerarMensagemProfissional(
      clienteNome,
      numeroOrcamento,
      valorTotal,
      approvalUrl,
      empresaNome
    );

    const texto = encodeURIComponent(mensagem);

    if (clienteTelefone) {
      // Remove caracteres não numéricos do telefone
      const telefoneLimpo = clienteTelefone.replace(/\D/g, "");
      // Se não começar com 55 (Brasil), adiciona
      const telefoneFormatado = telefoneLimpo.startsWith("55")
        ? telefoneLimpo
        : `55${telefoneLimpo}`;
      return `https://wa.me/${telefoneFormatado}?text=${texto}`;
    }

    // URL genérica se não tiver telefone
    return `https://wa.me/?text=${texto}`;
  }

  function construirUrlSMS(
    clienteNome: string,
    numeroOrcamento: string,
    approvalUrl: string,
    clienteTelefone?: string
  ): string {
    const mensagem = `Olá ${clienteNome}, seu orçamento #${numeroOrcamento} está pronto. Clique: ${approvalUrl}`;
    const texto = encodeURIComponent(mensagem);

    if (clienteTelefone) {
      const telefoneLimpo = clienteTelefone.replace(/\D/g, "");
      return `sms:${telefoneLimpo}?body=${texto}`;
    }

    return `sms:?body=${texto}`;
  }

  function gerarTextoCompartilhamento(
    clienteNome: string,
    numeroOrcamento: string,
    valorTotal: number,
    approvalUrl: string
  ): string {
    return `Orçamento ${numeroOrcamento} - ${clienteNome} - R$ ${valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n\n${approvalUrl}`;
  }

  return {
    rastrearCompartilhamento,
    gerarMensagemProfissional,
    construirUrlWhatsApp,
    construirUrlSMS,
    gerarTextoCompartilhamento,
  };
}
