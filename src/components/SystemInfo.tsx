export function SystemInfo() {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-xl p-6 h-full">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-lg">⚙️</span>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Sistema</p>
      </div>

      <div className="space-y-4">
        {/* Versão */}
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Versão</div>
          <div className="text-2xl font-bold text-cyan-400">2.0.0</div>
        </div>

        {/* Build */}
        <div className="pt-4 border-t border-slate-600">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Build</div>
          <div className="text-sm text-slate-300">Matrix Edition</div>
        </div>

        {/* Stack */}
        <div className="pt-4 border-t border-slate-600">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Stack</div>
          <div className="space-y-1 text-xs text-slate-400">
            <div>• React 19</div>
            <div>• TanStack Router</div>
            <div>• Supabase</div>
          </div>
        </div>

        {/* Status */}
        <div className="pt-4 border-t border-slate-600">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-xs text-green-400 font-medium">System OK</span>
          </div>
        </div>
      </div>
    </div>
  );
}
