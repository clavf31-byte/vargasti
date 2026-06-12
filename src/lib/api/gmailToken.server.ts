export async function deleteGmailToken() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { error } = await supabaseAdmin
    .from("gmail_tokens")
    .delete()
    .eq("user_id", "system");

  if (error) throw error;

  return { ok: true, message: "Token deletado com sucesso" };
}
