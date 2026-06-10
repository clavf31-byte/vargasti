import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "operator" | "viewer";
  status: "pending" | "active" | "rejected";
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed: boolean;
  provider: string;
};

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !data.user) throw new Error("Unauthorized");
  // SECURITY: read role from app_metadata only (service-role writable), NOT user_metadata
  const role = data.user.app_metadata?.role as string | undefined;
  if (role !== "admin") throw new Error("Acesso negado: somente administradores.");
}

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw new Error(error.message);
    return data.users.map((u): UserRow => ({
      id: u.id,
      email: u.email ?? "",
      full_name: (u.user_metadata?.full_name as string | undefined) ?? null,
      role: ((u.app_metadata?.role as string | undefined) ?? "operator") as UserRow["role"],
      status: ((u.app_metadata?.status as string | undefined) ?? "pending") as UserRow["status"],
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      email_confirmed: !!u.email_confirmed_at,
      provider: (u.app_metadata?.provider as string | undefined) ?? "email",
    }));
  });

export const updateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.string(),
      role: z.enum(["admin", "operator", "viewer"]).optional(),
      status: z.enum(["pending", "active", "rejected"]).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { id, ...meta } = data;
    // SECURITY: write role/status to app_metadata (service-role only) to prevent
    // privilege escalation via client-side supabase.auth.updateUser({ data: { role } })
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      app_metadata: meta,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    if (data.id === context.userId) throw new Error("Não é possível deletar a própria conta.");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      userId: z.string(),
      password: z.string().min(8),
    }),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);

    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    if (getUserError || !userData.user) throw new Error("Usuário não encontrado.");

    const provider = (userData.user.app_metadata?.provider as string | undefined) ?? "email";
    if (provider !== "email") {
      throw new Error("Não é possível alterar a senha de usuários com login Google.");
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);

    return { ok: true };
  });
