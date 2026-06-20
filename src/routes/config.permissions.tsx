import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui";
import { colors, spacing, borderRadius } from "@/lib/colors";
import { Check, X, AlertCircle, ShieldCheck, Clock, UserCheck, UserX } from "lucide-react";

export const Route = createFileRoute("/config/permissions")({
  head: () => ({ meta: [{ title: "Gerenciar Permissões · VargasTI" }] }),
  component: PermissionsPage,
});

interface UserAccess {
  id: string;
  email: string;
  name: string;
  role: string;
  status: "pending" | "approved" | "rejected";
  requested_at: string | null;
  can_access_crm: boolean;
  can_access_email: boolean;
  can_access_excel: boolean;
  can_access_notes: boolean;
  can_access_projects: boolean;
  can_access_files: boolean;
}

const MODULES = [
  { key: "can_access_crm", label: "CRM" },
  { key: "can_access_email", label: "Email Agent" },
  { key: "can_access_excel", label: "Excel Tool" },
  { key: "can_access_notes", label: "Anotações" },
  { key: "can_access_projects", label: "Projetos" },
  { key: "can_access_files", label: "Arquivos" },
];

function PermissionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      navigate({ to: "/login" });
      return;
    }
    checkAdminAndLoad();
  }, [user]);

  async function checkAdminAndLoad() {
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role, status")
      .eq("user_id", user!.id)
      .maybeSingle();

    console.log("[permissions] user:", user?.id, "roleData:", roleData, "error:", roleError);

    const admin = roleData?.role === "admin";
    setIsAdmin(admin);

    if (admin) {
      await loadUsers();
    } else {
      setLoading(false);
    }
  }

  async function loadUsers() {
    try {
      const [profilesRes, rolesRes, permsRes] = await Promise.all([
        supabase.from("profiles").select("id, email, full_name").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role, status, requested_at"),
        supabase.from("user_module_permissions").select("*"),
      ]);

      if (profilesRes.error) throw profilesRes.error;

      const rolesByUser = new Map((rolesRes.data || []).map((r: any) => [r.user_id, r]));
      const permsByUser = new Map((permsRes.data || []).map((p: any) => [p.user_id, p]));

      const enriched = (profilesRes.data || []).map((p: any) => {
        const roleData = rolesByUser.get(p.id) || {};
        const perms = permsByUser.get(p.id) || {};
        return {
          id: p.id,
          email: p.email || "",
          name: p.full_name || p.email || "",
          role: roleData.role || "user",
          status: (roleData.status || "approved") as UserAccess["status"],
          requested_at: roleData.requested_at || null,
          can_access_crm: perms.can_access_crm !== false,
          can_access_email: perms.can_access_email !== false,
          can_access_excel: perms.can_access_excel !== false,
          can_access_notes: perms.can_access_notes !== false,
          can_access_projects: perms.can_access_projects !== false,
          can_access_files: perms.can_access_files !== false,
        };
      });

      setUsers(enriched);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }

  async function setUserStatus(userId: string, status: "approved" | "rejected") {
    setApprovingId(userId);
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ status } as any)
        .eq("user_id", userId);
      if (error) throw error;
      setUsers(users.map((u) => u.id === userId ? { ...u, status } : u));
    } catch (err) {
      setError(`Erro ao ${status === "approved" ? "aprovar" : "rejeitar"} usuário`);
    } finally {
      setApprovingId(null);
    }
  }

  async function toggleAccess(userId: string, permission: string) {
    const u = users.find((x) => x.id === userId);
    if (!u) return;

    const newValue = !u[permission as keyof UserAccess];
    setUsers(users.map((x) => x.id === userId ? { ...x, [permission]: newValue } : x));
    setSaving(userId);

    try {
      const { error } = await supabase
        .from("user_module_permissions")
        .upsert(
          { user_id: userId, [permission]: newValue, updated_at: new Date().toISOString() } as any,
          { onConflict: "user_id" }
        );
      if (error) throw error;
    } catch (err) {
      console.error(err);
      setUsers(users.map((x) => x.id === userId ? { ...x, [permission]: !newValue } : x));
      setError("Erro ao salvar permissão");
    } finally {
      setSaving(null);
    }
  }

  if (isAdmin === null || loading) {
    return (
      <AppShell>
        <div style={{ padding: spacing.xl, color: colors.textSecondary }}>Carregando...</div>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <div style={{ padding: spacing.xl, maxWidth: 480 }}>
          <div style={{
            display: "flex", alignItems: "flex-start", gap: spacing.md,
            padding: spacing.lg, background: "#7f1d1d",
            borderRadius: borderRadius.md,
          }}>
            <AlertCircle size={20} color="#fca5a5" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ color: "#fca5a5", fontWeight: 600, margin: 0 }}>Acesso Restrito</p>
              <p style={{ color: "#fee2e2", fontSize: 14, margin: "6px 0 0" }}>
                Apenas administradores podem gerenciar permissões.
              </p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ padding: spacing.xl, maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: spacing.xl }}>
          <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, marginBottom: 6 }}>
            <ShieldCheck size={20} color={colors.primary} />
            <h1 style={{ margin: 0, color: colors.text, fontSize: 22, fontWeight: 700 }}>
              Permissões de Usuários
            </h1>
          </div>
          <p style={{ margin: 0, color: colors.textSecondary, fontSize: 13 }}>
            Controle quais módulos cada usuário pode acessar
          </p>
        </div>

        {error && (
          <div style={{
            padding: spacing.md, marginBottom: spacing.lg,
            background: "rgba(239,68,68,.1)", border: `1px solid ${colors.error}`,
            borderRadius: borderRadius.md, color: colors.error, fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* Seção de pendentes */}
        {users.filter(u => u.status === "pending").length > 0 && (
          <div style={{ marginBottom: spacing.xl }}>
            <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md }}>
              <Clock size={16} color="#f59e0b" />
              <span style={{ color: "#f59e0b", fontWeight: 600, fontSize: 13 }}>
                Aguardando aprovação ({users.filter(u => u.status === "pending").length})
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
              {users.filter(u => u.status === "pending").map(u => (
                <div key={u.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: spacing.md, background: "rgba(245,158,11,.06)",
                  border: "1px solid rgba(245,158,11,.2)", borderRadius: borderRadius.md,
                }}>
                  <div>
                    <div style={{ color: colors.text, fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                    <div style={{ color: colors.textSecondary, fontSize: 11 }}>{u.email}</div>
                    {u.requested_at && (
                      <div style={{ color: colors.textSecondary, fontSize: 10, marginTop: 2 }}>
                        Solicitado em {new Date(u.requested_at).toLocaleDateString("pt-BR")}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: spacing.sm }}>
                    <button
                      onClick={() => setUserStatus(u.id, "approved")}
                      disabled={approvingId === u.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "6px 14px", border: "none", borderRadius: borderRadius.sm,
                        background: colors.success, color: "#fff", fontSize: 12, fontWeight: 600,
                        cursor: approvingId === u.id ? "default" : "pointer",
                        opacity: approvingId === u.id ? 0.6 : 1,
                      }}
                    >
                      <UserCheck size={14} /> Aprovar
                    </button>
                    <button
                      onClick={() => setUserStatus(u.id, "rejected")}
                      disabled={approvingId === u.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "6px 14px", border: "none", borderRadius: borderRadius.sm,
                        background: colors.error, color: "#fff", fontSize: 12, fontWeight: 600,
                        cursor: approvingId === u.id ? "default" : "pointer",
                        opacity: approvingId === u.id ? 0.6 : 1,
                      }}
                    >
                      <UserX size={14} /> Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {users.filter(u => u.status !== "pending").length === 0 ? (
          <Card>
            <div style={{ textAlign: "center", padding: spacing.xl, color: colors.textSecondary }}>
              Nenhum usuário aprovado ainda.
            </div>
          </Card>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <th style={{ padding: spacing.md, textAlign: "left", color: colors.textSecondary, fontWeight: 600, fontSize: 11 }}>
                    USUÁRIO
                  </th>
                  <th style={{ padding: spacing.md, textAlign: "left", color: colors.textSecondary, fontWeight: 600, fontSize: 11 }}>
                    ROLE
                  </th>
                  <th style={{ padding: spacing.md, textAlign: "left", color: colors.textSecondary, fontWeight: 600, fontSize: 11 }}>
                    STATUS
                  </th>
                  {MODULES.map(({ key, label }) => (
                    <th key={key} style={{ padding: spacing.md, textAlign: "center", color: colors.textSecondary, fontWeight: 600, fontSize: 11 }}>
                      {label}
                    </th>
                  ))}
                  <th style={{ padding: spacing.md, textAlign: "center", color: colors.textSecondary, fontWeight: 600, fontSize: 11 }}>
                    AÇÕES
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.filter(u => u.status !== "pending").map((u) => (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${colors.border}`, opacity: u.status === "rejected" ? 0.5 : 1 }}>
                    <td style={{ padding: spacing.md }}>
                      <div style={{ color: colors.text, fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                      <div style={{ color: colors.textSecondary, fontSize: 11 }}>{u.email}</div>
                    </td>
                    <td style={{ padding: spacing.md }}>
                      <span style={{
                        display: "inline-block", padding: "3px 8px",
                        background: u.role === "admin" ? "rgba(19,200,211,.15)" : colors.backgroundTertiary,
                        color: u.role === "admin" ? colors.primary : colors.textSecondary,
                        borderRadius: borderRadius.sm, fontSize: 11, fontWeight: 700,
                        textTransform: "uppercase" as const,
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: spacing.md }}>
                      <span style={{
                        display: "inline-block", padding: "3px 8px",
                        background: u.status === "approved" ? "rgba(34,197,94,.12)" : "rgba(239,68,68,.12)",
                        color: u.status === "approved" ? "#4ade80" : "#f87171",
                        borderRadius: borderRadius.sm, fontSize: 11, fontWeight: 600,
                      }}>
                        {u.status === "approved" ? "Aprovado" : "Rejeitado"}
                      </span>
                    </td>
                    {MODULES.map(({ key }) => {
                      const enabled = u[key as keyof UserAccess] as boolean;
                      return (
                        <td key={key} style={{ padding: spacing.md, textAlign: "center" }}>
                          <button
                            onClick={() => toggleAccess(u.id, key)}
                            disabled={saving === u.id || u.role === "admin" || u.status === "rejected"}
                            title={u.role === "admin" ? "Admin tem acesso total" : enabled ? "Revogar acesso" : "Conceder acesso"}
                            style={{
                              width: 32, height: 32,
                              border: "none",
                              borderRadius: borderRadius.sm,
                              background: u.role === "admin" || enabled ? colors.success : colors.backgroundTertiary,
                              color: "#fff",
                              cursor: u.role === "admin" || saving === u.id ? "default" : "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              margin: "0 auto",
                              opacity: saving === u.id ? 0.6 : u.role === "admin" ? 0.5 : 1,
                              transition: "all 0.15s",
                            }}
                          >
                            {u.role === "admin" || enabled ? <Check size={15} /> : <X size={15} />}
                          </button>
                        </td>
                      );
                    })}
                    <td style={{ padding: spacing.md, textAlign: "center" }}>
                      {u.role !== "admin" && (
                        <button
                          onClick={() => setUserStatus(u.id, u.status === "approved" ? "rejected" : "approved")}
                          disabled={approvingId === u.id}
                          title={u.status === "approved" ? "Revogar acesso" : "Restaurar acesso"}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "4px 10px", border: "none", borderRadius: borderRadius.sm,
                            background: u.status === "approved" ? "rgba(239,68,68,.15)" : "rgba(34,197,94,.15)",
                            color: u.status === "approved" ? "#f87171" : "#4ade80",
                            fontSize: 11, fontWeight: 600, cursor: "pointer",
                            opacity: approvingId === u.id ? 0.6 : 1,
                          }}
                        >
                          {u.status === "approved" ? <><UserX size={12} /> Revogar</> : <><UserCheck size={12} /> Restaurar</>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p style={{ marginTop: spacing.lg, color: colors.textSecondary, fontSize: 11 }}>
          Alteracoes tem efeito no proximo login do usuario.
        </p>
      </div>
    </AppShell>
  );
}
