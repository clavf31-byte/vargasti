export function SystemInfo() {
  const stack = ["React 19", "TanStack Router", "Supabase"];

  return (
    <div className="bg-surface border border-border rounded-xl p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-5">
        <div className="size-1.5 rounded-full bg-brand status-pulse" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sistema</p>
      </div>

      <div className="space-y-4 flex-1">
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Versão</p>
          <p className="text-2xl font-bold text-brand tabular-nums">{__APP_VERSION__}</p>
        </div>

        <div className="pt-3 border-t border-border/50">
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-2">Build</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Número</span>
              <span className="text-[10px] font-mono text-foreground">#{__BUILD_NUMBER__}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Commit</span>
              <span className="text-[10px] font-mono text-brand">{__GIT_HASH__}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Data</span>
              <span className="text-[10px] font-mono text-foreground">{__BUILD_DATE__}</span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-border/50">
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-2">Stack</p>
          <div className="flex flex-wrap gap-1">
            {stack.map((s) => (
              <span key={s} className="text-[9px] text-muted-foreground bg-surface-2 border border-border rounded px-1.5 py-0.5">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-border/30 mt-3">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-brand status-pulse" />
          <span className="text-[9px] text-brand font-medium">Sistema operacional</span>
        </div>
      </div>
    </div>
  );
}
