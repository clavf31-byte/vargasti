import { CalendarDays } from "lucide-react";

interface VisionOfTodayProps {
  notesCount: number;
  projectsCount: number;
  filesCount: number;
  toolsCount: number;
}

const items = (n: number, p: number, f: number, t: number) => [
  { label: "Anotações", value: n, color: "border-brand/30 bg-brand/10 text-brand" },
  { label: "Projetos",  value: p, color: "border-info/30 bg-info/10 text-info" },
  { label: "Tools",     value: t, color: "border-purple-400/30 bg-purple-400/10 text-purple-400" },
  { label: "Arquivos",  value: f, color: "border-warning/30 bg-warning/10 text-warning" },
];

export function VisionOfToday({ notesCount, projectsCount, filesCount, toolsCount }: VisionOfTodayProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6 h-full">
      <div className="flex items-center gap-2 mb-6">
        <CalendarDays className="size-4 text-muted-foreground" />
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Visão de Hoje</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {items(notesCount, projectsCount, filesCount, toolsCount).map((item) => (
          <div key={item.label} className={`rounded-lg border ${item.color} p-4 text-center`}>
            <div className="text-2xl font-bold mb-1">{item.value}</div>
            <div className="text-xs text-muted-foreground font-medium">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
