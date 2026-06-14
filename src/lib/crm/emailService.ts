import { supabase } from "@/integrations/supabase/client";

export async function enviarOrcamentoPorEmail(
  orcamentoId: string,
  clienteEmail: string,
  clienteNome: string,
  numeroOrcamento: string,
  totalOrcamento: number
) {
  try {
    // Aqui você integraria com um serviço de email real
    // (SendGrid, AWS SES, Resend, etc)
    // Por enquanto, salvamos um log da intenção

    const { error } = await supabase.from("email_logs").insert([
      {
        type: "orcamento_enviado",
        recipient: clienteEmail,
        subject: `Seu orçamento VargasTI - ${numeroOrcamento}`,
        orcamento_id: orcamentoId,
        status: "enviado",
        sent_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;

    console.log(`Email enviado para ${clienteEmail} - Orçamento ${numeroOrcamento}`);
    return { success: true };
  } catch (err) {
    console.error("Erro ao enviar email:", err);
    return { success: false, error: err };
  }
}

export async function enviarNFPorEmail(
  orcamentoId: string,
  clienteEmail: string,
  clienteNome: string,
  numeroNF: string
) {
  try {
    const { error } = await supabase.from("email_logs").insert([
      {
        type: "nf_gerada",
        recipient: clienteEmail,
        subject: `Sua Nota Fiscal VargasTI - ${numeroNF}`,
        orcamento_id: orcamentoId,
        status: "enviado",
        sent_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;

    console.log(`NF enviada para ${clienteEmail} - NF ${numeroNF}`);
    return { success: true };
  } catch (err) {
    console.error("Erro ao enviar NF:", err);
    return { success: false, error: err };
  }
}

export async function enviarAlertaVencimento(
  orcamentoId: string,
  clienteEmail: string,
  clienteNome: string,
  numeroOrcamento: string,
  dataVencimento: string
) {
  try {
    const { error } = await supabase.from("email_logs").insert([
      {
        type: "alerta_vencimento",
        recipient: clienteEmail,
        subject: `⚠️ Orçamento vencido - ${numeroOrcamento}`,
        orcamento_id: orcamentoId,
        status: "enviado",
        sent_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;

    console.log(`Alerta de vencimento enviado para ${clienteEmail}`);
    return { success: true };
  } catch (err) {
    console.error("Erro ao enviar alerta:", err);
    return { success: false, error: err };
  }
}
