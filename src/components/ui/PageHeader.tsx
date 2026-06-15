import { ReactNode } from "react";
import { colors, spacing } from "@/lib/colors";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function PageHeader({ title, subtitle, action, icon }: PageHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: spacing.xxl,
        paddingBottom: spacing.lg,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: spacing.lg }}>
        {icon && (
          <div style={{ fontSize: "32px", opacity: 0.7 }}>
            {icon}
          </div>
        )}
        <div>
          <h1
            style={{
              margin: "0 0 0.5rem 0",
              color: colors.text,
              fontSize: "40px",
              fontWeight: 700,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                margin: 0,
                color: colors.textSecondary,
                fontSize: "14px",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
