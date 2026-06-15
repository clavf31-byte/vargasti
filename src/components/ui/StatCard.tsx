import { ReactNode } from "react";
import { colors, borderRadius, shadows } from "@/lib/colors";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: string;
  onClick?: () => void;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({
  label,
  value,
  icon,
  color = colors.primary,
  onClick,
  trend,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: colors.gradient.dark,
        border: `1px solid ${colors.border}`,
        borderRadius: borderRadius.lg,
        padding: "1.5rem",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.3s ease",
        boxShadow: shadows.small,
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = color;
          e.currentTarget.style.boxShadow = shadows.glow;
          e.currentTarget.style.transform = "translateY(-4px)";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = colors.border;
          e.currentTarget.style.boxShadow = shadows.small;
          e.currentTarget.style.transform = "translateY(0)";
        }
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div>
          <div style={{ fontSize: "12px", color: colors.textSecondary, textTransform: "uppercase", marginBottom: "0.75rem" }}>
            {label}
          </div>
          <div style={{ fontSize: "32px", fontWeight: 700, color }}>
            {value}
          </div>
        </div>
        {icon && (
          <div style={{ fontSize: "32px", opacity: 0.3 }}>
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div style={{ fontSize: "12px", color: trend === "up" ? colors.success : trend === "down" ? colors.error : colors.textSecondary }}>
          {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} Comparado ao mês anterior
        </div>
      )}
    </div>
  );
}
