import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

      console.log(`[contract-email] Preparing to send email to ${clientEmail}`);

      // Aqui você pode integrar com:
      // 1. SendGrid
      // 2. Resend
      // 3. AWS SES
      // 4. Seu próprio servidor de email
      // 5. Sistema de email existente do projeto

      // Por enquanto, apenas simula o envio
      const emailContent = `
${message}

---
ID do Contrato: ${contractId}
Título: ${contractTitle}

Para assinar digitalmente:
1. Baixe o PDF do contrato
2. Abra com seu leitor PDF
3. Use seu certificado digital (e-CPF ou e-CNPJ) para assinar
4. Devolva o PDF assinado

Você pode usar:
- Gov.br (https://www.gov.br/cidadania/pt-br/acesso-a-informacao/assinatura-digital)
- Adobe Sign
- Signer
- Ou outro programa de assinatura digital que tenha seu certificado
      `.trim();

      console.log(`[contract-email] Would send:\nTo: ${clientEmail}\nSubject: ${contractTitle}\nBody: ${emailContent}`);

      // TODO: Implementar envio real de email
      // Por exemplo, com SendGrid:
      // await sgMail.send({
      //   to: clientEmail,
      //   from: 'contratos@vargasti.com.br',
      //   subject: `Contrato para assinatura: ${contractTitle}`,
      //   text: emailContent,
      //   replyTo: 'suporte@vargasti.com.br',
      // });

      return {
        ok: true,
        message: `Email enviado para ${clientEmail}`,
        contractId,
      };
    } catch (error) {
      console.error("[contract-email] Error:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Erro ao enviar email",
      };
    }
  });
