interface ActivityCardProps {
  type: "note" | "project" | "tool";
  title: string;
  description: string;
  date: string;
  timeAgo: string;
}

const badgeConfig = {
  note: { label: "NOTE", bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30" },
  project: { label: "PROJ", bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
  tool: { label: "TOOL", bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
};

export function ActivityCard({ type, title, description, date, timeAgo }: ActivityCardProps) {
  const badge = badgeConfig[type];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-3 transition-all duration-200 hover:border-slate-600 hover:translate-x-1">
      <div className="flex gap-4 items-start">
        <div className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${badge.bg} ${badge.text} border ${badge.border}`}>
          {badge.label}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-100 text-sm mb-1">{title}</div>
          <div className="text-xs text-slate-400 mb-2 truncate">{description}</div>
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>{date}</span>
            <span>{timeAgo}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
