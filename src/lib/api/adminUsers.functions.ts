import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizeRole, normalizeStatus } from "@/lib/operatorPermissions";
import type { OperatorRole, OperatorStatus } from "@/lib/operatorPermissions";

export type { OperatorRole, OperatorStatus };

export type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: OperatorRole;
  status: OperatorStatus;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed: boolean;
  provider: string;
  permissions: Record<string, boolean>;
};

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .order("role", { ascending: true })
    .limit(1);
  if (error || !data?.length) throw new Error("Unauthorized");
  if (data[0].role !== "admin") throw new Error("Acesso negado: somente administradores.");
}

function buildRow(u: any, roleRow: any, profile: any, perms: any): UserRow {
  return {
    id: u.id,
    email: u.email ?? "",
    full_name: profile?.full_name ?? (u.user_metadata?.full_name as string | undefined) ?? null,
    role: normalizeRole(roleRow?.role),
    status: normalizeStatus(roleRow?.status),
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
    email_confirmed: !!u.email_confirmed_at,
    provider: (u.app_metadata?.provider as string | undefined) ?? "email",
    permissions: (perms?.permissions ?? {}) as Record<string, boolean>,
  };
}

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);

    const [authRes, rolesRes, profilesRes, permsRes] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
      supabaseAdmin.from("user_roles").select("user_id, role, status"),
      supabaseAdmin.from("profiles").select("id, full_name"),
      supabaseAdmin.from("user_module_permissions").select("user_id, permissions"),
    ]);

    if (authRes.error) throw new Error(authRes.error.message);

    const rolesByUser = new Map((rolesRes.data ?? []).map((r: any) => [r.user_id, r]));
    const profilesByUser = new Map((profilesRes.data ?? []).map((p: any) => [p.id, p]));
    const permsByUser = new Map((permsRes.data ?? []).map((p: any) => [p.user_id, p]));

    return authRes.data.users.map((u) =>
      buildRow(u, rolesByUser.get(u.id), profilesByUser.get(u.id), permsByUser.get(u.id)),
    );
  });

export const getOperator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);

    const [authRes, roleRes, profileRes, permsRes] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(data.id),
      supabaseAdmin.from("user_roles").select("role, status").eq("user_id", data.id).order("role", { ascending: true }).limit(1),
      supabaseAdmin.from("profiles").select("id, full_name").eq("id", data.id).maybeSingle(),
      supabaseAdmin.from("user_module_permissions").select("user_id, permissions").eq("user_id", data.id).maybeSingle(),
    ]);

    if (authRes.error || !authRes.data.user) throw new Error("Operador não encontrado.");
    return buildRow(authRes.data.user, (roleRes.data as any)?.[0], permsRes.data, permsRes.data);
  });

export const updateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.string(),
      role: z.enum(["admin", "gestor", "administrativo", "tecnico", "operador", "cliente"]).optional(),
      status: z.enum(["pending", "approved", "rejected"]).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { id, ...updates } = data;
    if (!Object.keys(updates).length) return { ok: true };

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("user_roles")
      .update(updates)
      .eq("user_id", id)
      .select("user_id");

    if (updateError) throw new Error(updateError.message);

    if (!updated || updated.length === 0) {
      const { error: insertError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: id, role: updates.role ?? "operador", status: updates.status ?? "approved" });
      if (insertError) throw new Error(insertError.message);
    }

    return { ok: true };
  });

export const updatePermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ userId: z.string(), permissions: z.record(z.boolean()) }))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("user_module_permissions")
      .upsert(
        { user_id: data.userId, permissions: data.permissions, updated_at: new Date().toISOString() } as any,
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    if (data.id === context.userId) throw new Error("Não é possível excluir a própria conta.");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ userId: z.string(), password: z.string().min(8) }))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    if (getUserError || !userData.user) throw new Error("Usuário não encontrado.");
    const provider = (userData.user.app_metadata?.provider as string | undefined) ?? "email";
    if (provider !== "email") throw new Error("Não é possível alterar a senha de usuários com login Google.");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { password: data.password });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
