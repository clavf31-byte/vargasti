import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "operator" | "viewer";
  status: "pending" | "approved" | "rejected";
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed: boolean;
  provider: string;
  can_access_crm: boolean;
  can_access_email: boolean;
  can_access_excel: boolean;
  can_access_notes: boolean;
  can_access_projects: boolean;
  can_access_files: boolean;
};

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .limit(1);
  if (error || !data?.length) throw new Error("Unauthorized");
  if (data[0].role !== "admin") throw new Error("Acesso negado: somente administradores.");
}

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);

    const [authRes, rolesRes, profilesRes, permsRes] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
      supabaseAdmin.from("user_roles").select("user_id, role, status"),
      supabaseAdmin.from("profiles").select("id, full_name"),
      supabaseAdmin.from("user_module_permissions").select("*"),
    ]);

    if (authRes.error) throw new Error(authRes.error.message);

    const rolesByUser = new Map((rolesRes.data ?? []).map((r: any) => [r.user_id, r]));
    const profilesByUser = new Map((profilesRes.data ?? []).map((p: any) => [p.id, p]));
    const permsByUser = new Map((permsRes.data ?? []).map((p: any) => [p.user_id, p]));

    return authRes.data.users.map((u): UserRow => {
      const roleRow = rolesByUser.get(u.id) as any;
      const profile = profilesByUser.get(u.id) as any;
      const perms = permsByUser.get(u.id) as any;
      const rawRole = roleRow?.role ?? "viewer";
      const normalizedRole = rawRole === "user" ? "viewer" : rawRole;
      const rawStatus = roleRow?.status ?? "pending";
      const normalizedStatus = rawStatus === "active" ? "approved" : rawStatus;

      return {
        id: u.id,
        email: u.email ?? "",
        full_name: profile?.full_name ?? (u.user_metadata?.full_name as string | undefined) ?? null,
        role: normalizedRole as UserRow["role"],
        status: normalizedStatus as UserRow["status"],
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        email_confirmed: !!u.email_confirmed_at,
        provider: (u.app_metadata?.provider as string | undefined) ?? "email",
        can_access_crm: perms?.can_access_crm !== false,
        can_access_email: perms?.can_access_email !== false,
        can_access_excel: perms?.can_access_excel !== false,
        can_access_notes: perms?.can_access_notes !== false,
        can_access_projects: perms?.can_access_projects !== false,
        can_access_files: perms?.can_access_files !== false,
      };
    });
  });

export const updateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.string(),
      role: z.enum(["admin", "operator", "viewer"]).optional(),
      status: z.enum(["pending", "approved", "rejected"]).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { id, ...updates } = data;
    if (!Object.keys(updates).length) return { ok: true };

    const payload: any = { user_id: id, ...updates };
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert(payload, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateModulePermission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      userId: z.string(),
      permission: z.string(),
      value: z.boolean(),
    }),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("user_module_permissions")
      .upsert(
        { user_id: data.userId, [data.permission]: data.value, updated_at: new Date().toISOString() },
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
