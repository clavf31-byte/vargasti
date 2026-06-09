interface VisionOfTodayProps {
  notesCount: number;
  projectsCount: number;
  filesCount: number;
  toolsCount: number;
}

export function VisionOfToday({ notesCount, projectsCount, filesCount, toolsCount }: VisionOfTodayProps) {
  const items = [
    { label: "Anotações", value: notesCount, color: "border-green-500/30 bg-green-500/10 text-green-400" },
    { label: "Projetos", value: projectsCount, color: "border-blue-500/30 bg-blue-500/10 text-blue-400" },
    { label: "Arquivos", value: filesCount, color: "border-amber-500/30 bg-amber-500/10 text-amber-400" },
    { label: "Tools", value: toolsCount, color: "border-purple-500/30 bg-purple-500/10 text-purple-400" },
  ];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 h-full">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-lg">📅</span>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Visão de Hoje</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.label} className={`rounded-lg border ${item.color} p-4 text-center`}>
            <div className="text-2xl font-bold mb-1">{item.value}</div>
            <div className="text-xs text-slate-400 font-medium">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
