import { Search, X, LucideIcon } from "lucide-react";
import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from "react";

// ── PageHeader ────────────────────────────────────────────────────────────────
interface PageHeaderProps {
  category: string;
  title: string;
  icon?: LucideIcon;
  iconClass?: string;
  subtitle?: string | ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ category, title, icon: Icon, iconClass, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-3">
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{category}</p>
        <h1 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
          {Icon && <Icon className={`size-4 ${iconClass ?? "text-brand"}`} />}
          {title}
        </h1>
        {subtitle && (
          typeof subtitle === "string"
            ? <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            : <div className="mt-0.5">{subtitle}</div>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  colorClass?: string;
}

export function StatCard({ label, value, colorClass = "text-foreground" }: StatCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center gap-3">
      <div className={`text-xl font-bold tabular-nums leading-none ${colorClass}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide leading-tight">{label}</div>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="size-12 rounded-2xl bg-surface border border-border grid place-items-center">
        <Icon className="size-5 text-muted-foreground/40" />
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground">{title}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground/60 mt-1">{subtitle}</p>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}

// ── SectionTitle ──────────────────────────────────────────────────────────────
interface SectionTitleProps {
  icon?: LucideIcon;
  iconClass?: string;
  children: ReactNode;
}

export function SectionTitle({ icon: Icon, iconClass, children }: SectionTitleProps) {
  return (
    <div className="flex items-center gap-2">
      {Icon && <Icon className={`size-3.5 ${iconClass ?? "text-muted-foreground"}`} />}
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{children}</p>
    </div>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────────
interface StatusBadgeProps {
  status: string;
  colorConfig: Record<string, string>;
  dotConfig?: Record<string, string>;
  showDot?: boolean;
}

export function StatusBadge({ status, colorConfig, dotConfig, showDot = false }: StatusBadgeProps) {
  const cls = colorConfig[status] ?? "text-muted-foreground border-muted-foreground/30 bg-surface-2";
  const dotCls = dotConfig?.[status] ?? "bg-muted-foreground/40";
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] border rounded-lg px-2 py-0.5 font-medium ${cls}`}>
      {showDot && <span className={`size-1.5 rounded-full ${dotCls}`} />}
      {status}
    </span>
  );
}

// ── Toolbar ───────────────────────────────────────────────────────────────────
interface ToolbarProps {
  searchValue: string;
  onSearchChange: (v: string) => void;
  placeholder?: string;
  children?: ReactNode;
}

export function Toolbar({ searchValue, onSearchChange, placeholder = "Buscar...", children }: ToolbarProps) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand/40 focus:ring-1 focus:ring-brand/20 transition-all"
        />
      </div>
      {children && <div className="flex gap-1.5 flex-wrap">{children}</div>}
    </div>
  );
}

// ── Btn ───────────────────────────────────────────────────────────────────────
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  children: ReactNode;
}

const VARIANT_CLASSES = {
  primary:   "bg-brand text-brand-foreground hover:bg-brand/90",
  secondary: "border border-border text-muted-foreground hover:text-foreground hover:bg-surface-2",
  ghost:     "text-muted-foreground hover:text-foreground hover:bg-white/5",
  danger:    "border border-destructive/30 text-destructive hover:bg-destructive/10",
};

export function Btn({ variant = "primary", size = "md", className = "", children, ...rest }: BtnProps) {
  const s = size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm";
  return (
    <button
      className={`flex items-center gap-1.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${s} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

// ── FieldInput ────────────────────────────────────────────────────────────────
interface FieldInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function FieldInput({ label, className = "", ...rest }: FieldInputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-[10px] text-muted-foreground uppercase tracking-widest">{label}</label>}
      <input
        className={`w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand/40 focus:ring-1 focus:ring-brand/20 placeholder:text-muted-foreground transition-all ${className}`}
        {...rest}
      />
    </div>
  );
}

// ── DataCard ──────────────────────────────────────────────────────────────────
interface DataCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function DataCard({ title, children, className = "" }: DataCardProps) {
  return (
    <div className={`bg-surface border border-border rounded-xl overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 py-2.5 border-b border-border/50 bg-surface-2/50">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{title}</p>
        </div>
      )}
      {children}
    </div>
  );
}

// ── FormModal ─────────────────────────────────────────────────────────────────
interface FormModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function FormModal({ title, subtitle, onClose, children, footer }: FormModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div
        className="relative bg-surface border border-border rounded-2xl w-full max-w-md p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
        {children}
        {footer && (
          <div className="flex justify-end gap-2 pt-1 border-t border-border/50">{footer}</div>
        )}
      </div>
    </div>
  );
}
