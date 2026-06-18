import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Resend } from "resend";

const Schema = z.object({
  orcamentoNumero: z.string(),
  orcamentoTotal: z.number(),
  clienteNome: z.string(),
  aprovado: z.boolean(),
  motivo: z.string().optional(),
});

export const sendApprovalNotification = createServerFn({ method: "POST" })
  .inputValidator(Schema)
  .handler(async ({ data }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY não configurada");

    const notifyEmail = process.env.RESEND_REPLY_TO || process.env.RESEND_FROM_EMAIL;
    if (!notifyEmail) throw new Error("Email de notificação não configurado");

    const resend = new Resend(apiKey);
    const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    const cor = data.aprovado ? "#22c55e" : "#ef4444";
    const titulo = data.aprovado ? "Orçamento Aprovado!" : "Orçamento Recusado";
    const icone = data.aprovado ? "✓" : "✗";

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; background: #f0f4f8; }
          .container { max-width: 560px; margin: 32px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
          .hero { background: ${data.aprovado ? "linear-gradient(135deg,#0f1e2e,#0c2a3e)" : "#1a0a0a"}; padding: 32px; text-align: center; }
          .icon { width: 56px; height: 56px; background: ${cor}; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; color: white; font-weight: 700; margin-bottom: 16px; }
          .hero h1 { color: white; margin: 0; font-size: 22px; }
          .body { padding: 28px 32px; }
          .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .row:last-child { border-bottom: none; }
          .label { color: #64748b; }
          .value { font-weight: 600; color: #1a2332; }
          .total { font-size: 20px; color: ${data.aprovado ? "#0891b2" : "#ef4444"}; }
          .motivo { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px; margin-top: 16px; font-size: 13px; color: #991b1b; }
        </style>
        </head>
        <body>
          <div class="container">
            <div class="hero">
              <div class="icon">${icone}</div>
              <h1>${titulo}</h1>
            </div>
            <div class="body">
              <div class="row"><span class="label">Orçamento</span><span class="value">#${data.orcamentoNumero}</span></div>
              <div class="row"><span class="label">Cliente</span><span class="value">${data.clienteNome}</span></div>
              <div class="row"><span class="label">Valor</span><span class="value total">R$ ${data.orcamentoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
              ${!data.aprovado && data.motivo ? `<div class="motivo"><strong>Motivo da recusa:</strong><br>${data.motivo}</div>` : ""}
            </div>
          </div>
        </body>
      </html>
    `;

    const response = await resend.emails.send({
      from,
      to: notifyEmail,
      subject: `${icone} ${titulo} — #${data.orcamentoNumero} (${data.clienteNome})`,
      html,
    });

    if (response.error) throw new Error(response.error.message);
    return { success: true };
  });
