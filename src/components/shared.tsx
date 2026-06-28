import { Search, X, LucideIcon } from "lucide-react";
import {
  createElement,
  isValidElement,
  ReactNode,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  HTMLAttributes,
  type ElementType,
  type FC,
} from "react";
import { Skeleton } from "@/components/ui/skeleton";

// ── PageHeader ────────────────────────────────────────────────────────────────
interface PageHeaderProps {
  category?: string;
  title: string;
  icon?: LucideIcon | ReactNode;
  iconClass?: string;
  subtitle?: string | ReactNode;
  actions?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({ category, title, icon: Icon, iconClass, subtitle, actions, action }: PageHeaderProps) {
  const renderedIcon = Icon
    ? isValidElement(Icon)
      ? Icon
      : (typeof Icon === "function" || (typeof Icon === "object" && Icon !== null && "$$typeof" in Icon))
        ? createElement(Icon as ElementType, { className: `size-6 shrink-0 ${iconClass ?? "text-brand"}` })
        : Icon
    : null;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:justify-between">
      <div className="min-w-0">
        {category && <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em] mb-2">{category}</p>}
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
          {renderedIcon}
          <span className="truncate">{title}</span>
        </h1>
        {subtitle && (
          typeof subtitle === "string"
            ? <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
            : <div className="mt-1.5">{subtitle}</div>
        )}
      </div>
      {(actions || action) && <div className="flex items-center gap-2 shrink-0">{actions || action}</div>}
    </div>
  );
}

// ── SectionHeader (smaller, for in-page sections) ─────────────────────────────
interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
}

export function SectionHeader({ eyebrow, title, subtitle, icon: Icon, actions }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-3">
      <div>
        {eyebrow && <p className="text-[10px] text-muted-foreground uppercase tracking-[0.18em] mb-1.5">{eyebrow}</p>}
        <h2 className="text-lg font-semibold text-foreground tracking-tight flex items-center gap-2">
          {Icon && <Icon className="size-4 text-select" />}
          {title}
        </h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ── IconBox ───────────────────────────────────────────────────────────────────
interface IconBoxProps {
  icon: LucideIcon;
  variant?: "select" | "brand" | "warning" | "info" | "muted";
  size?: "sm" | "md" | "lg";
}

const ICON_BOX_VARIANTS = {
  select:  "bg-select/15 border-select/30 text-select",
  brand:   "bg-brand/10 border-brand/25 text-brand",
  warning: "bg-warning/10 border-warning/25 text-warning",
  info:    "bg-info/10 border-info/25 text-info",
  muted:   "bg-surface-2 border-border text-muted-foreground",
};

const ICON_BOX_SIZES = {
  sm: "size-9 rounded-lg [&_svg]:size-4",
  md: "size-12 rounded-xl [&_svg]:size-5",
  lg: "size-14 rounded-xl [&_svg]:size-6",
};

export function IconBox({ icon: Icon, variant = "select", size = "md" }: IconBoxProps) {
  return (
    <div className={`grid place-items-center border ${ICON_BOX_VARIANTS[variant]} ${ICON_BOX_SIZES[size]}`}>
      <Icon />
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  colorClass?: string;
  color?: string;
}

export function StatCard({ label, value, colorClass = "text-foreground", color }: StatCardProps) {
  return (
    <div className="card-graphite px-5 py-4 flex items-center gap-4">
      <div className={`text-2xl font-bold tabular-nums leading-none ${colorClass}`} style={color ? { color } : undefined}>{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider leading-tight">{label}</div>
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
    <div className="card-graphite border-dashed flex flex-col items-center justify-center py-16 px-6 gap-4 text-center">
      <div className="size-14 rounded-xl bg-surface-2 border border-border grid place-items-center">
        <Icon className="size-6 text-muted-foreground/60" />
      </div>
      <div className="max-w-sm">
        <p className="text-base font-semibold text-foreground">{title}</p>
        {subtitle && <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

// ── LoadingState ──────────────────────────────────────────────────────────────
export function LoadingState({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="size-8 rounded-full border-2 border-border border-t-select animate-spin" />
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// ── SectionTitle (small label, retained for compat) ──────────────────────────
interface SectionTitleProps {
  icon?: LucideIcon;
  iconClass?: string;
  children: ReactNode;
}

export function SectionTitle({ icon: Icon, iconClass, children }: SectionTitleProps) {
  return (
    <div className="flex items-center gap-2">
      {Icon && <Icon className={`size-3.5 ${iconClass ?? "text-muted-foreground"}`} />}
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{children}</p>
    </div>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────────
export const DEFAULT_STATUS_COLOR: Record<string, string> = {
  rascunho:             "text-muted-foreground border-muted-foreground/30 bg-surface-2",
  enviado:              "text-info border-info/30 bg-info/10",
  aprovado:             "text-brand border-brand/30 bg-brand/10",
  assinado:             "text-brand border-brand/30 bg-brand/10",
  rejeitado:            "text-destructive border-destructive/30 bg-destructive/10",
  pendente:             "text-warning border-warning/30 bg-warning/10",
  atrasado:             "text-destructive border-destructive/30 bg-destructive/10",
  concluido:            "text-muted-foreground border-muted-foreground/30 bg-surface-2",
  "concluído":          "text-muted-foreground border-muted-foreground/30 bg-surface-2",
  conectado:            "text-brand border-brand/30 bg-brand/10",
  desconectado:         "text-destructive border-destructive/30 bg-destructive/10",
  ativo:                "text-brand border-brand/30 bg-brand/10",
  agendado:             "text-info border-info/30 bg-info/10",
  confirmado:           "text-brand border-brand/30 bg-brand/10",
  cancelado:            "text-destructive border-destructive/30 bg-destructive/10",
  "em andamento":       "text-info border-info/30 bg-info/10",
  "em análise":         "text-warning border-warning/30 bg-warning/10",
  "em desenvolvimento": "text-info border-info/30 bg-info/10",
  arquivado:            "text-muted-foreground/50 border-muted-foreground/20 bg-surface-2/50",
  ideia:                "text-muted-foreground border-muted-foreground/30 bg-surface-2",
  testando:             "text-warning border-warning/30 bg-warning/10",
  finalizado:           "text-brand border-brand/30 bg-brand/10",
};

export const DEFAULT_STATUS_DOT: Record<string, string> = {
  rascunho:             "bg-muted-foreground/40",
  enviado:              "bg-info",
  aprovado:             "bg-brand",
  assinado:             "bg-brand",
  rejeitado:            "bg-destructive",
  pendente:             "bg-warning",
  atrasado:             "bg-destructive",
  concluido:            "bg-muted-foreground/40",
  "concluído":          "bg-muted-foreground/40",
  conectado:            "bg-brand",
  desconectado:         "bg-destructive",
  ativo:                "bg-brand",
  agendado:             "bg-info",
  confirmado:           "bg-brand",
  cancelado:            "bg-destructive",
  "em andamento":       "bg-info",
  "em análise":         "bg-warning",
  "em desenvolvimento": "bg-info",
  arquivado:            "bg-muted-foreground/30",
  ideia:                "bg-muted-foreground/40",
  testando:             "bg-warning",
  finalizado:           "bg-brand",
};

interface StatusBadgeProps {
  status: string;
  colorConfig?: Record<string, string>;
  dotConfig?: Record<string, string>;
  showDot?: boolean;
}

export function StatusBadge({ status, colorConfig, dotConfig, showDot = false }: StatusBadgeProps) {
  const merged = colorConfig ? { ...DEFAULT_STATUS_COLOR, ...colorConfig } : DEFAULT_STATUS_COLOR;
  const mergedDot = dotConfig ? { ...DEFAULT_STATUS_DOT, ...dotConfig } : DEFAULT_STATUS_DOT;
  const cls = merged[status] ?? "text-muted-foreground border-border bg-surface-2";
  const dotCls = mergedDot[status] ?? "bg-muted-foreground/40";
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] border rounded-md px-2 py-0.5 font-medium ${cls}`}>
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
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-surface/60 border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-select/60 focus:ring-2 focus:ring-select/20 transition-all"
        />
      </div>
      {children && <div className="flex gap-2 flex-wrap">{children}</div>}
    </div>
  );
}

// ── Btn ───────────────────────────────────────────────────────────────────────
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "select";
  size?: "sm" | "md";
  children: ReactNode;
}

const VARIANT_CLASSES = {
  primary:   "bg-brand text-brand-foreground hover:bg-brand/90 shadow-sm",
  select:    "bg-select text-select-foreground hover:bg-select/90 shadow-sm",
  secondary: "border border-border bg-surface/60 text-foreground hover:bg-surface-2 hover:border-select/40",
  ghost:     "text-muted-foreground hover:text-foreground hover:bg-white/5",
  danger:    "border border-destructive/30 text-destructive bg-destructive/5 hover:bg-destructive/15",
};

export function Btn({ variant = "primary", size = "md", className = "", children, ...rest }: BtnProps) {
  const s = size === "sm" ? "px-3 py-1.5 text-xs h-8" : "px-4 py-2 text-sm h-10";
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${s} ${className}`}
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
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[11px] text-muted-foreground uppercase tracking-[0.14em] font-medium">{label}</label>}
      <input
        className={`w-full bg-surface/60 border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-select/60 focus:ring-2 focus:ring-select/20 placeholder:text-muted-foreground/70 transition-all ${className}`}
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
    <div className={`card-graphite overflow-hidden ${className}`}>
      {title && (
        <div className="px-5 py-3 border-b border-border/60 bg-surface-2/40">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.16em] font-semibold">{title}</p>
        </div>
      )}
      {children}
    </div>
  );
}

// ── ModernCard (generic graphite container) ──────────────────────────────────
export function ModernCard({ className = "", children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card-graphite p-6 ${className}`} {...rest}>
      {children}
    </div>
  );
}

// ── SelectableCard ───────────────────────────────────────────────────────────
interface SelectableCardProps extends HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
}

export function SelectableCard({ selected, className = "", children, ...rest }: SelectableCardProps) {
  return (
    <div
      className={`card-selectable hover:card-selectable-hover p-6 ${selected ? "card-selected" : ""} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

// ── SkeletonCard ──────────────────────────────────────────────────────────────
export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="card-graphite p-5 space-y-3">
      <Skeleton className="h-4 w-2/3 bg-surface-2" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={`h-3 bg-surface-2 ${i === rows - 1 ? "w-1/2" : "w-full"}`} />
      ))}
    </div>
  );
}

// ── SkeletonTableRow ──────────────────────────────────────────────────────────
export function SkeletonTableRow({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border/50">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className={`h-3 bg-surface-2 ${i === 0 ? "w-1/4" : i === cols - 1 ? "w-16" : "flex-1"}`} />
      ))}
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
      <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
      <div
        className="relative card-graphite w-full max-w-md p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground tracking-tight">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
        {footer && (
          <div className="flex justify-end gap-2 pt-4 border-t border-border/60">{footer}</div>
        )}
      </div>
    </div>
  );
}

// ── InlineFormPanel ───────────────────────────────────────────────────────────
// Wrapper que anima height de 0 → auto usando CSS grid-template-rows.
// Uso: <InlineFormPanel open={isFormOpen}><MeuForm /></InlineFormPanel>
export const InlineFormPanel: FC<{ open: boolean; children: ReactNode }> = ({ open, children }) => (
  <div
    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
    }`}
  >
    <div className="overflow-hidden">
      <div className="pb-2">{children}</div>
    </div>
  </div>
);
