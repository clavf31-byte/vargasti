import { supabase } from "@/integrations/supabase/client";

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
    // Chamar edge function ou função RPC para enviar email
    // Para agora, simular o envio
    console.log("Enviando email para:", input.cliente_email);
    console.log("Link de aprovação:", input.approval_url);

    // TODO: Implementar com Resend, SendGrid ou outro
    // const response = await fetch('/api/send-email', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(input)
    // });

    // Registrar no histórico de tentativas
    await registrarTentativaEmail(
      input.orcamento_numero,
      input.cliente_email,
      "pendente"
    );

    return {
      success: true,
      message_id: `msg_${Date.now()}`,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Erro ao enviar email";
    await registrarTentativaEmail(
      input.orcamento_numero,
      input.cliente_email,
      "erro",
      errorMsg
    );

    return {
      success: false,
      error: errorMsg,
    };
  }
}

async function registrarTentativaEmail(
  orcamentoNumero: string,
  email: string,
  status: "pendente" | "sucesso" | "erro",
  motivo_erro?: string
): Promise<void> {
  try {
    // Criar log de tentativa (estrutura simples)
    console.log(`[EMAIL LOG] ${orcamentoNumero} → ${email} (${status})`);
    if (motivo_erro) console.log(`  Motivo: ${motivo_erro}`);
  } catch (err) {
    console.error("Erro ao registrar tentativa de email:", err);
  }
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export function gerarTemplateOrcamento(input: EmailInput): EmailTemplate {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0bd0d7; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f5f5f5; padding: 20px; }
          .footer { background: #1f2937; color: white; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #0bd0d7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .valor { font-size: 24px; font-weight: bold; color: #0bd0d7; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>VargasTI - Novo Orçamento</h1>
          </div>

          <div class="content">
            <p>Olá <strong>${input.cliente_nome}</strong>,</p>

            <p>Enviamos um orçamento para você:</p>

            <div style="background: white; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p><strong>Orçamento #${input.orcamento_numero}</strong></p>
              <p class="valor">R$ ${input.orcamento_total.toFixed(2)}</p>
            </div>

            <p>Para aprovar ou rejeitar este orçamento, clique no botão abaixo:</p>

            <a href="${input.approval_url}" class="button">👍 Aprovar Orçamento</a>

            <p style="color: #666; font-size: 12px;">
              Ou acesse: <br>
              <code style="word-break: break-all;">${input.approval_url}</code>
            </p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

            <p style="color: #666; font-size: 12px;">
              Este link expira em 30 dias.<br>
              Dúvidas? Entre em contato conosco.
            </p>
          </div>

          <div class="footer">
            <p style="margin: 0;">
              <strong>${input.user_name || "VargasTI"}</strong><br>
              ${input.user_email || "suporte@vargasti.com"}<br>
              <a href="https://vargasti.com" style="color: #0bd0d7; text-decoration: none;">vargasti.com</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    VargasTI - Novo Orçamento

    Olá ${input.cliente_nome},

    Enviamos um orçamento para você:

    Orçamento #${input.orcamento_numero}
    Valor: R$ ${input.orcamento_total.toFixed(2)}

    Para aprovar ou rejeitar, acesse:
    ${input.approval_url}

    Este link expira em 30 dias.
  `;

  return {
    subject: `Novo Orçamento #${input.orcamento_numero} - VargasTI`,
    html,
    text,
  };
}
