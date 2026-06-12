"use server";

import { json } from "@tanstack/react-router";

export async function deleteGmailToken() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not configured");
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/gmail_tokens?user_id=eq.system`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete token: ${response.statusText}`);
    }

    return { ok: true, message: "Token deletado com sucesso" };
  } catch (err) {
    console.error("[deleteGmailToken] Error:", err);
    throw err;
  }
}
