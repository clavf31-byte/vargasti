import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { Resend } from "resend";
import { supabase } from "@/integrations/supabase/client";
import crypto from "crypto";

const SendContractAccessEmailSchema = z.object({
  contractId: z.string(),
  contractTitle: z.string(),
  clientEmail: z.string().email(),
  clientName: z.string(),
  senderName: z.string().optional(),
});

export const sendContractAccessEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(SendContractAccessEmailSchema)
  .handler(async ({ data }) => {
    // Gerar token seguro
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Válido por 7 dias

    // Salvar token no banco
    const { error: tokenError } = await (supabase as any)
      .from("contract_access_tokens")
      .insert([{
        contract_id: data.contractId,
        token,
        email: data.clientEmail,
        expires_at: expiresAt.toISOString(),
      }]);

    if (tokenError) throw new Error(`Erro ao gerar token: ${tokenError.message}`);

    // Preparar link seguro
    const baseUrl = process.env.VITE_SUPABASE_URL?.split("/").slice(0, 3).join("/") || "https://www.vargasti.com.br";
    const accessUrl = `${baseUrl}/contrato/acompanhamento/${data.contractId}?token=${token}`;

    // Enviar email via Resend
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
            .button { background: #0bd0d7; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: 600; margin: 16px 0; }
            .footer { background: #1f2937; color: #9ca3af; padding: 20px 24px; border-radius: 0 0 8px 8px; font-size: 13px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 16px 0; border-radius: 4px; }
            .expiry { color: #666; font-size: 12px; margin: 12px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0;font-size:20px;">Contrato para assinatura</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${data.clientName}</strong>,</p>
              <p>${data.senderName || "VargasTI"} compartilhou um contrato para você revisar e assinar.</p>

              <div class="card">
                <p style="margin:0 0 4px;color:#666;font-size:13px;">CONTRATO</p>
                <p style="margin:0;font-weight:600;font-size:16px;">${data.contractTitle}</p>
              </div>

              <div class="card" style="text-align:center;">
                <a href="${accessUrl}" class="button">Abrir Contrato</a>
                <p class="expiry">Este link é válido por 7 dias</p>
              </div>

              <div class="warning">
                <p style="margin:0;font-weight:600;color:#b45309;">⚠️ Link Seguro</p>
                <p style="margin:4px 0 0;font-size:13px;">Este link foi compartilhado especificamente com você. Não compartilhe este link com terceiros.</p>
              </div>

              <div class="card">
                <p style="margin:0 0 12px;font-weight:600;">Como assinar:</p>
                <ol style="margin:8px 0;padding-left:20px;">
                  <li>Clique no botão acima ou copie o link</li>
                  <li>Preencha seu nome completo</li>
                  <li>Marque "Aceito os termos"</li>
                  <li>Clique em "Assinar Contrato"</li>
                </ol>
              </div>

              <p style="color:#666;font-size:13px;margin-top:24px;">Dúvidas? Entre em contato com ${data.senderName || "VargasTI"}</p>
            </div>
            <div class="footer">
              <strong style="color:white;">VargasTI</strong>
              <p style="margin:8px 0 0;font-size:12px;">Esta é uma comunicação automática. Por favor, não responda este email.</p>
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

    return { success: true, messageId: response.data?.id, token };
  });
