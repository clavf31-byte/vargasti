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

const gradientClasses = {
  teal: "from-teal-500 to-cyan-500",
  blue: "from-blue-500 to-blue-600",
  purple: "from-purple-500 to-purple-600",
  amber: "from-amber-500 to-orange-600",
};

export function KpiCard({ label, value, icon: Icon, to, gradient, trend, progress = 60 }: KpiCardProps) {
  return (
    <Link
      to={to}
      className="group bg-slate-800 border border-slate-700 rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:border-slate-600 hover:shadow-lg hover:shadow-black/30"
    >
      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradientClasses[gradient]} flex items-center justify-center mb-4 shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>

      <div className="text-4xl font-bold text-slate-100 mb-1">{value}</div>
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</div>

      {trend && <div className="text-xs text-green-400 font-medium mb-3">↑ {trend}</div>}

      {progress && (
        <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${gradientClasses[gradient]} transition-all duration-500`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </Link>
  );
}
