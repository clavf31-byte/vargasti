import { ReactNode } from "react";
import { colors, borderRadius, shadows } from "@/lib/colors";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  loading = false,
  type = "button",
}: ButtonProps) {
  const variants = {
    primary: {
      bg: colors.primary,
      text: colors.background,
      hover: colors.primaryLight,
    },
    secondary: {
      bg: `rgba(19, 200, 211, 0.1)`,
      text: colors.primary,
      hover: `rgba(19, 200, 211, 0.2)`,
    },
    danger: {
      bg: colors.error,
      text: "#fff",
      hover: "#ff5252",
    },
    ghost: {
      bg: "transparent",
      text: colors.text,
      hover: colors.backgroundTertiary,
    },
  };

  const sizes = {
    sm: "8px 12px",
    md: "10px 20px",
    lg: "12px 24px",
  };

  const variantStyle = variants[variant];
  const padding = sizes[size];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        background: variantStyle.bg,
        color: variantStyle.text,
        border: "none",
        borderRadius: borderRadius.md,
        padding,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        fontWeight: 600,
        fontSize: "14px",
        transition: "all 0.3s ease",
        opacity: disabled || loading ? 0.6 : 1,
        boxShadow: shadows.small,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.background = variantStyle.hover;
          e.currentTarget.style.boxShadow = shadows.medium;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.background = variantStyle.bg;
          e.currentTarget.style.boxShadow = shadows.small;
        }
      }}
    >
      {loading ? "Carregando..." : children}
    </button>
  );
}
