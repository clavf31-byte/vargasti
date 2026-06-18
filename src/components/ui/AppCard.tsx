import { CSSProperties, ReactNode } from "react";
import { colors, shadows, borderRadius } from "@/lib/colors";

interface CardProps {
  children: ReactNode;
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}

export function Card({ children, hover = false, clickable = false, onClick, style }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: colors.backgroundSecondary,
        border: `1px solid ${colors.border}`,
        borderRadius: borderRadius.lg,
        padding: "1.5rem",
        cursor: clickable ? "pointer" : "default",
        transition: "all 0.3s ease",
        boxShadow: shadows.small,
        ...(hover && {
          borderColor: colors.primary,
          boxShadow: shadows.glow,
          transform: "translateY(-4px)",
        }),
        ...style,
      }}
      onMouseEnter={(e) =>
        hover &&
        (e.currentTarget.style.borderColor = colors.primary)
      }
      onMouseLeave={(e) =>
        hover &&
        (e.currentTarget.style.borderColor = colors.border)
      }
    >
      {children}
    </div>
  );
}
