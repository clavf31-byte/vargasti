import { ReactNode } from "react";
import { cn } from "@/lib/utils";

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

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:   "bg-brand text-brand-foreground hover:bg-brand/90 shadow-sm",
  secondary: "border border-select/30 text-select bg-select/10 hover:bg-select/20",
  danger:    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  ghost:     "text-foreground hover:bg-surface-2",
};

const SIZE_CLASSES = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-5 text-sm",
  lg: "h-11 px-6 text-sm",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  loading = false,
  type = "button",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size]
      )}
    >
      {loading ? "Carregando..." : children}
    </button>
  );
}
