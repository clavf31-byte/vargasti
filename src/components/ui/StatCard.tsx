import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: string;
  onClick?: () => void;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({ label, value, icon, color, onClick, trend }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "card-graphite p-6",
        onClick && "cursor-pointer card-hover hover:border-select/30 hover:-translate-y-0.5"
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">{label}</div>
          <div
            className="text-3xl font-bold tabular-nums"
            style={color ? { color } : undefined}
          >
            {value}
          </div>
        </div>
        {icon && <div className="text-3xl opacity-30">{icon}</div>}
      </div>
      {trend && (
        <div className={cn(
          "text-xs font-medium",
          trend === "up"   ? "text-brand"        :
          trend === "down" ? "text-destructive"  :
                             "text-muted-foreground"
        )}>
          {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} Comparado ao mês anterior
        </div>
      )}
    </div>
  );
}
