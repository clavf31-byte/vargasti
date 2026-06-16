import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Card, Button } from "@/components/ui";
import { colors, spacing, borderRadius } from "@/lib/colors";
import { Check, X, Lock, Unlock } from "lucide-react";

export const Route = createFileRoute("/config/permissions")({
  head: () => ({ meta: [{ title: "Gerenciar Permissões · VargasTI" }] }),
  component: PermissionsPage,
});

interface UserAccess {
  id: string;
  email: string;
  name: string;
  role: string;
  can_access_crm: boolean;
  can_access_email: boolean;
  can_access_excel: boolean;
  can_access_notes: boolean;
  can_access_projects: boolean;
  can_access_files: boolean;
}

function PermissionsPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserAccess[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, role")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const enrichedUsers = (data || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.full_name || u.email,
        role: u.role || "user",
        can_access_crm: true,
        can_access_email: true,
        can_access_excel: true,
        can_access_notes: true,
        can_access_projects: true,
        can_access_files: true,
      }));

      setUsers(enrichedUsers);
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAccess(userId: string, permission: string) {
    setUsers(
      users.map((u) =>
        u.id === userId ? { ...u, [permission]: !u[permission] } : u
      )
    );
  }

  const modules = [
    { key: "can_access_crm", label: "CRM", icon: "📊" },
    { key: "can_access_email", label: "Email Agent", icon: "📧" },
    { key: "can_access_excel", label: "Excel Tool", icon: "📊" },
    { key: "can_access_notes", label: "Anotações", icon: "📝" },
    { key: "can_access_projects", label: "Projetos", icon: "📁" },
    { key: "can_access_files", label: "Arquivos", icon: "💾" },
  ];

  return (
    <AppShell>
      <div style={{ padding: spacing.xl, maxWidth: "1400px", margin: "0 auto" }}>
        {/* HEADER */}
        <div style={{ marginBottom: spacing.xl }}>
          <h1 style={{ margin: 0, color: colors.text, fontSize: "28px", fontWeight: 700 }}>
            🔐 Gerenciar Permissões
          </h1>
          <p style={{ margin: "0.5rem 0 0 0", color: colors.textSecondary, fontSize: "14px" }}>
            Controle o acesso de cada operador aos módulos do sistema
          </p>
        </div>

        {/* LOADING */}
        {loading ? (
          <Card>
            <div style={{ textAlign: "center", padding: spacing.xl, color: colors.textSecondary }}>
              Carregando usuários...
            </div>
          </Card>
        ) : users.length === 0 ? (
          <Card>
            <div style={{ textAlign: "center", padding: spacing.xl, color: colors.textSecondary }}>
              Nenhum usuário encontrado
            </div>
          </Card>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <th style={{ padding: spacing.md, textAlign: "left", color: colors.textSecondary, fontWeight: 600, fontSize: "12px" }}>
                    USUÁRIO
                  </th>
                  <th style={{ padding: spacing.md, textAlign: "left", color: colors.textSecondary, fontWeight: 600, fontSize: "12px" }}>
                    ROLE
                  </th>
                  {modules.map(({ key, label, icon }) => (
                    <th key={key} style={{ padding: spacing.md, textAlign: "center", color: colors.textSecondary, fontWeight: 600, fontSize: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                        <span>{icon}</span>
                        <span>{label}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((userAccess) => (
                  <tr key={userAccess.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: spacing.md }}>
                      <div>
                        <div style={{ color: colors.text, fontWeight: 600 }}>{userAccess.name}</div>
                        <div style={{ color: colors.textSecondary, fontSize: "12px" }}>{userAccess.email}</div>
                      </div>
                    </td>
                    <td style={{ padding: spacing.md, color: colors.text }}>
                      <span style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        background: colors.backgroundTertiary,
                        borderRadius: borderRadius.sm,
                        fontSize: "12px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}>
                        {userAccess.role}
                      </span>
                    </td>
                    {modules.map(({ key }) => (
                      <td key={key} style={{ padding: spacing.md, textAlign: "center" }}>
                        <button
                          onClick={() => toggleAccess(userAccess.id, key)}
                          style={{
                            width: "32px",
                            height: "32px",
                            border: "none",
                            borderRadius: borderRadius.sm,
                            background: userAccess[key as keyof UserAccess] ? colors.success : colors.backgroundTertiary,
                            color: "#fff",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s",
                          }}
                          title={userAccess[key as keyof UserAccess] ? "Revogar acesso" : "Conceder acesso"}
                        >
                          {userAccess[key as keyof UserAccess] ? (
                            <Check size={16} />
                          ) : (
                            <X size={16} />
                          )}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* FOOTER */}
        <div style={{ marginTop: spacing.xl, textAlign: "center", color: colors.textSecondary, fontSize: "12px" }}>
          <p>💡 Clique nos ícones para conceder ou revogar acesso aos módulos</p>
        </div>
      </div>
    </AppShell>
  );
}
