import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Resend } from "resend";

const SendQuotationEmailSchema = z.object({
  clienteEmail: z.string().email(),
  clienteNome: z.string(),
  orcamentoNumero: z.string(),
  orcamentoTotal: z.number(),
  approvalUrl: z.string(),
  userName: z.string().optional(),
  userEmail: z.string().optional(),
});

export const sendQuotationEmail = createServerFn({ method: "POST" })
  .validator(SendQuotationEmailSchema)
  .handler(async ({ data }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY não configurada");

    const resend = new Resend(apiKey);
    const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const replyTo = process.env.RESEND_REPLY_TO || undefined;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0bd0d7; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 20px; }
            .content { background: #f5f5f5; padding: 24px; }
            .card { background: white; padding: 16px; border-radius: 8px; margin: 20px 0; }
            .valor { font-size: 28px; font-weight: bold; color: #0bd0d7; margin: 4px 0; }
            .button { display: inline-block; background: #0bd0d7; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; margin: 16px 0; }
            .footer { background: #1f2937; color: #9ca3af; padding: 20px 24px; border-radius: 0 0 8px 8px; font-size: 13px; }
            .footer a { color: #0bd0d7; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>VargasTI — Novo Orçamento</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${data.clienteNome}</strong>,</p>
              <p>Preparamos um orçamento especialmente para você. Confira os detalhes abaixo:</p>

              <div class="card">
                <p style="margin:0 0 4px; color:#666; font-size:13px;">ORÇAMENTO</p>
                <p style="margin:0; font-weight:600; font-size:16px;">#${data.orcamentoNumero}</p>
                <p class="valor">R$ ${data.orcamentoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>

              <p>Para aprovar ou recusar este orçamento, clique no botão abaixo:</p>

              <a href="${data.approvalUrl}" class="button">Ver e Aprovar Orçamento</a>

              <p style="color:#888; font-size:12px; margin-top:24px;">
                Ou acesse diretamente:<br>
                <a href="${data.approvalUrl}" style="color:#0bd0d7; word-break:break-all;">${data.approvalUrl}</a>
              </p>

              <p style="color:#888; font-size:12px; border-top:1px solid #ddd; padding-top:16px; margin-top:24px;">
                Este link expira em 30 dias. Em caso de dúvidas, responda este email.
              </p>
            </div>
            <div class="footer">
              <strong style="color:white;">${data.userName || "VargasTI"}</strong><br>
              ${data.userEmail ? `<a href="mailto:${data.userEmail}">${data.userEmail}</a>` : ""}
            </div>
          </div>
        </body>
      </html>
    `;

    const response = await resend.emails.send({
      from,
      to: data.clienteEmail,
      subject: `Orçamento #${data.orcamentoNumero} — VargasTI`,
      html,
      ...(replyTo ? { replyTo } : {}),
    });

    if (response.error) throw new Error(response.error.message);

    return { success: true, messageId: response.data?.id };
  });
