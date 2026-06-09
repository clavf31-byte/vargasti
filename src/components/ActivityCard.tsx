interface ActivityCardProps {
  type: "note" | "project" | "tool";
  title: string;
  description: string;
  date: string;
  timeAgo: string;
}

const badgeConfig = {
  note:    { label: "NOTE", bg: "bg-brand/20",    text: "text-brand",    border: "border-brand/30" },
  project: { label: "PROJ", bg: "bg-info/20",     text: "text-info",     border: "border-info/30" },
  tool:    { label: "TOOL", bg: "bg-warning/20",  text: "text-warning",  border: "border-warning/30" },
};

export function ActivityCard({ type, title, description, date, timeAgo }: ActivityCardProps) {
  const badge = badgeConfig[type];

  return (
    <div className="bg-surface border border-border rounded-lg p-4 mb-3 transition-all duration-200 hover:border-border/80 hover:translate-x-1">
      <div className="flex gap-4 items-start">
        <div className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${badge.bg} ${badge.text} border ${badge.border}`}>
          {badge.label}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground text-sm mb-1">{title}</div>
          <div className="text-xs text-muted-foreground mb-2 truncate">{description}</div>
          <div className="flex justify-between items-center text-xs text-muted-foreground/70">
            <span>{date}</span>
            <span>{timeAgo}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
