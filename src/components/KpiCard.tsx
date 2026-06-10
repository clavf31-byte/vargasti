import { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  to: string;
  gradient: "teal" | "blue" | "purple" | "amber";
  trend?: string;
  progress?: number;
}

const iconTokens = {
  teal:   { bg: "bg-brand/12",   border: "border-brand/30",   text: "text-brand",   bar: "bg-brand" },
  blue:   { bg: "bg-select/15",  border: "border-select/30",  text: "text-select",  bar: "bg-select" },
  purple: { bg: "bg-info/12",    border: "border-info/30",    text: "text-info",    bar: "bg-info" },
  amber:  { bg: "bg-warning/12", border: "border-warning/30", text: "text-warning", bar: "bg-warning" },
};

export function KpiCard({ label, value, icon: Icon, to, gradient, trend, progress = 60 }: KpiCardProps) {
  const t = iconTokens[gradient];
  return (
    <Link
      to={to}
      className="card-selectable hover:card-selectable-hover group p-6 flex flex-col gap-4"
    >
      <div className="flex items-start justify-between">
        <div className={`size-12 rounded-xl ${t.bg} border ${t.border} ${t.text} grid place-items-center transition-transform group-hover:scale-105`}>
          <Icon className="size-5" />
        </div>
        {trend && <div className="text-xs text-brand font-medium">↑ {trend}</div>}
      </div>

      <div>
        <div className="text-3xl font-bold text-foreground tabular-nums leading-none">{value}</div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2">{label}</div>
      </div>

      {progress !== undefined && (
        <div className="w-full h-1 bg-surface-2 rounded-full overflow-hidden">
          <div
            className={`h-full ${t.bar} transition-all duration-500`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </Link>
  );
}
