import { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { colors, spacing, borderRadius } from "@/lib/colors";
import { Users, FileText, DollarSign, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface CRMLayoutProps {
  children: ReactNode;
}

export function CRMLayout({ children }: CRMLayoutProps) {
  const navigate = useNavigate();
  const { signOut: logout } = useAuth();

  const menuItems = [
    { label: "Clientes", icon: Users, path: "/crm/clientes" },
    { label: "Orçamentos", icon: FileText, path: "/crm/orcamentos" },
    { label: "Pagamentos", icon: DollarSign, path: "/crm/pagamentos" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: colors.background }}>
      {/* Sidebar */}
      <div
        style={{
          width: "280px",
          background: colors.backgroundSecondary,
          borderRight: `1px solid ${colors.border}`,
          padding: spacing.lg,
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          height: "100vh",
          overflowY: "auto",
        }}
      >
        {/* Logo */}
        <div
          style={{
            marginBottom: spacing.xxl,
            paddingBottom: spacing.lg,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: 700,
              color: colors.primary,
              display: "flex",
              alignItems: "center",
              gap: spacing.sm,
            }}
          >
            📊 CRM
          </h1>
          <p
            style={{
              margin: "0.5rem 0 0 0",
              fontSize: "12px",
              color: colors.textSecondary,
            }}
          >
            VargasTI
          </p>
        </div>

        {/* Menu Items */}
        <nav style={{ flex: 1 }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate({ to: item.path })}
                style={{
                  width: "100%",
                  padding: `${spacing.md} ${spacing.lg}`,
                  marginBottom: spacing.md,
                  background: "transparent",
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.md,
                  color: colors.text,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: spacing.md,
                  fontSize: "14px",
                  fontWeight: 500,
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.backgroundTertiary;
                  e.currentTarget.style.borderColor = colors.primary;
                  e.currentTarget.style.color = colors.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = colors.border;
                  e.currentTarget.style.color = colors.text;
                }}
              >
                <Icon size={20} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={() => {
            logout();
            navigate({ to: "/login" });
          }}
          style={{
            width: "100%",
            padding: `${spacing.md} ${spacing.lg}`,
            background: colors.error,
            border: "none",
            borderRadius: borderRadius.md,
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: spacing.md,
            fontSize: "14px",
            fontWeight: 600,
            transition: "all 0.3s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          <LogOut size={20} />
          Sair
        </button>
      </div>

      {/* Content */}
      <div style={{ marginLeft: "280px", flex: 1, overflow: "auto" }}>
        {children}
      </div>
    </div>
  );
}
