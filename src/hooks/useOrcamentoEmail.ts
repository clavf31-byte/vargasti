import { sendQuotationEmail } from "@/lib/api/sendQuotationEmail";

interface EmailInput {
  cliente_email: string;
  cliente_nome: string;
  orcamento_numero: string;
  orcamento_total: number;
  approval_url: string;
  user_name?: string;
  user_email?: string;
}

export async function enviarOrcamentoPorEmail(
  input: EmailInput
): Promise<{ success: boolean; error?: string; message_id?: string }> {
  try {
    const result = await sendQuotationEmail({
      data: {
        clienteEmail: input.cliente_email,
        clienteNome: input.cliente_nome,
        orcamentoNumero: input.orcamento_numero,
        orcamentoTotal: input.orcamento_total,
        approvalUrl: input.approval_url,
        userName: input.user_name,
        userEmail: input.user_email,
      },
    });

    return { success: true, message_id: result.messageId };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Erro ao enviar email";
    return { success: false, error };
  }
}
