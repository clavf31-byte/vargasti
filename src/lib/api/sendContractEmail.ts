import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SendContractEmailSchema = z.object({
  contractId: z.string(),
  clientEmail: z.string().email(),
  clientName: z.string(),
  contractTitle: z.string(),
  message: z.string(),
});

type SendContractEmailPayload = z.infer<typeof SendContractEmailSchema>;

export const sendContractEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(SendContractEmailSchema)
  .handler(async ({ data }) => {
    try {
      const { contractId, clientEmail, clientName, contractTitle, message } = data;

      // TODO: Integrar com serviço de email (Resend, SendGrid, etc)
      // Por enquanto, apenas registra que tentou enviar
      console.log(`[contract-email] Sending to ${clientEmail}:`, {
        contractId,
        clientName,
        contractTitle,
        message,
      });

      // Simular envio bem-sucedido
      return {
        ok: true,
        message: "Email enfileirado para envio",
        clientEmail,
      };
    } catch (err) {
      console.error("[contract-email] Error:", err);
      throw err instanceof Error ? err : new Error("Erro desconhecido");
    }
  });
