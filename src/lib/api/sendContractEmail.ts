import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Resend } from "resend";

const SendContractEmailSchema = z.object({
  contractId: z.string(),
  clientEmail: z.string().email(),
  clientName: z.string(),
  contractTitle: z.string(),
  message: z.string(),
  userName: z.string().optional(),
});

export const sendContractEmail = createServerFn({ method: "POST" })
  .inputValidator(SendContractEmailSchema)
  .handler(async ({ data }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY não configurada");

    const resend = new Resend(apiKey);
    const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0bd0d7; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0; }
            .content { background: #f5f5f5; padding: 24px; }
            .card { background: white; padding: 16px; border-radius: 8px; margin: 20px 0; }
            .steps { counter-reset: step; }
            .step { display: flex; gap: 12px; margin: 12px 0; }
            .step-num { background: #0bd0d7; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; flex-shrink: 0; }
            .footer { background: #1f2937; color: #9ca3af; padding: 20px 24px; border-radius: 0 0 8px 8px; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0;font-size:20px;">Contrato para assinatura</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${data.clientName}</strong>,</p>
              <p>${data.message.replace(/\n/g, "<br>")}</p>

              <div class="card">
                <p style="margin:0 0 4px;color:#666;font-size:13px;">CONTRATO</p>
                <p style="margin:0;font-weight:600;font-size:16px;">${data.contractTitle}</p>
              </div>

              <div class="card">
                <p style="margin:0 0 12px;font-weight:600;">Como assinar digitalmente:</p>
                <div style="margin:8px 0;display:flex;gap:12px;align-items:flex-start;">
                  <span style="background:#0bd0d7;color:white;width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;flex-shrink:0;">1</span>
                  <span>Baixe o PDF e abra com um leitor que suporte assinatura digital</span>
                </div>
                <div style="margin:8px 0;display:flex;gap:12px;align-items:flex-start;">
                  <span style="background:#0bd0d7;color:white;width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;flex-shrink:0;">2</span>
                  <span>Assine usando seu certificado digital (e-CPF/e-CNPJ ou Gov.br)</span>
                </div>
                <div style="margin:8px 0;display:flex;gap:12px;align-items:flex-start;">
                  <span style="background:#0bd0d7;color:white;width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;flex-shrink:0;">3</span>
                  <span>Responda este email com o PDF assinado em anexo</span>
                </div>
              </div>
            </div>
            <div class="footer">
              <strong style="color:white;">${data.userName || "VargasTI"}</strong>
            </div>
          </div>
        </body>
      </html>
    `;

    const response = await resend.emails.send({
      from,
      to: data.clientEmail,
      subject: `Contrato para assinatura: ${data.contractTitle}`,
      html,
    });

    if (response.error) throw new Error(response.error.message);

    return { success: true, messageId: response.data?.id };
  });
