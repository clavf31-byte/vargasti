import { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface SubItem { val: string; lbl: string; color?: string }

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  to: string;
  gradient: "blue" | "purple" | "amber";
  badge?: { text: string; variant: "up" | "warn" | "neu" };
  breakdown: [SubItem, SubItem, SubItem];
  footer: { label: string; value: string };
  progress: number;
}

const tokens = {
  blue:   { icon: "bg-select/15 border-select/30 text-select",   bar: "bg-select" },
  purple: { icon: "bg-info/12 border-info/30 text-info",         bar: "bg-info" },
  amber:  { icon: "bg-warning/12 border-warning/30 text-warning", bar: "bg-warning" },
};

const badgeClass = {
  up:   "bg-success/15 text-success",
  warn: "bg-warning/15 text-warning",
  neu:  "bg-surface-2 text-muted-foreground",
};

export function KpiCard({ label, value, icon: Icon, to, gradient, badge, breakdown, footer, progress }: KpiCardProps) {
  const t = tokens[gradient];
  return (
    <Link to={to} className="card-selectable hover:card-selectable-hover group p-5 flex flex-col gap-0">
      {/* Top */}
      <div className="flex items-start justify-between mb-4">
        <div className={`size-11 rounded-xl border ${t.icon} grid place-items-center transition-transform group-hover:scale-105`}>
          <Icon className="size-5" />
        </div>
        {badge && (
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${badgeClass[badge.variant]}`}>
            {badge.text}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="text-4xl font-bold text-foreground tabular-nums leading-none">{value}</div>
      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-1.5">{label}</div>

      {/* Divider */}
      <div className="h-px bg-white/5 my-3.5" />

      {/* Breakdown */}
      <div className="flex items-center justify-between">
        {breakdown.map((item, i) => (
          <>
            <div key={i} className="text-center">
              <div className="text-sm font-bold" style={{ color: item.color ?? "var(--foreground)" }}>{item.val}</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{item.lbl}</div>
            </div>
            {i < 2 && <div key={`sep-${i}`} className="w-px h-7 bg-white/6" />}
          </>
        ))}
      </div>

      {/* Progress */}
      <div className="mt-3.5">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] text-muted-foreground">{footer.label}</span>
          <span className="text-[10px] font-semibold text-foreground/70">{footer.value}</span>
        </div>
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <div className={`h-full ${t.bar} rounded-full transition-all duration-700`} style={{ width: `${progress}%` }} />
        </div>
      </div>
    </Link>
  );
}
