import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Resend } from "resend";

const SendContractEmailSchema = z.object({
  contractId: z.string(),
  clientEmail: z.string().email(),
  clientName: z.string(),
  contractTitle: z.string(),
  message: z.string(),
});

type SendContractEmailPayload = z.infer<typeof SendContractEmailSchema>;

export const POST = createServerFn({ method: "POST" })
  .inputValidator(SendContractEmailSchema)
  .handler(async ({ data }) => {
    try {
      const { contractId, clientEmail, clientName, contractTitle, message } = data;
      const apiKey = process.env.RESEND_API_KEY;

      if (!apiKey) {
        throw new Error("RESEND_API_KEY não configurada");
      }

      const resend = new Resend(apiKey);

      console.log(`[contract-email] Enviando contrato para ${clientEmail}...`);

      const response = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "contratos@vargasti.com.br",
        to: clientEmail,
        subject: `📜 Contrato para assinatura: ${contractTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Olá ${clientName}!</h2>

            <p>${message.split("\n").join("<br />")}</p>

            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>📋 Contrato: ${contractTitle}</h3>
              <p><strong>ID:</strong> ${contractId}</p>
            </div>

            <h3>🔐 Como assinar digitalmente:</h3>
            <ol>
              <li>Baixe o PDF do contrato</li>
              <li>Abra com um programa que suporte assinatura digital</li>
              <li>Use seu certificado digital (e-CPF ou e-CNPJ)</li>
              <li>Devolva o PDF assinado respondendo este email</li>
            </ol>

            <div style="background: #e8f4f8; padding: 15px; border-left: 4px solid #0284c7; margin: 20px 0;">
              <p><strong>Programas recomendados:</strong></p>
              <ul>
                <li><a href="https://www.gov.br/cidadania">Gov.br - Assinador Digital Oficial</a></li>
                <li><a href="https://www.signer.digital">Signer</a></li>
                <li>Adobe Reader (versão premium)</li>
                <li>DocuSign</li>
              </ul>
            </div>

            <p style="color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              Se tiver dúvidas, entre em contato conosco.<br />
              <strong>VargasTI</strong>
            </p>
          </div>
        `,
        replyTo: process.env.RESEND_REPLY_TO || "contratos@vargasti.com.br",
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      console.log(`[contract-email] Email enviado com sucesso! ID: ${response.data?.id}`);

      return {
        ok: true,
        message: `Email enviado com sucesso para ${clientEmail}`,
        contractId,
        emailId: response.data?.id,
      };
    } catch (error) {
      console.error("[contract-email] Error:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Erro ao enviar email",
      };
    }
  });
