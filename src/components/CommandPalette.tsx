import { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Mail, FileSpreadsheet, MessageCircle, FolderKanban, NotebookPen, Files, Settings } from "lucide-react";

const COMMANDS = [
  { id: "dashboard", label: "Dashboard", icon: "🏠", path: "/" },
  { id: "emails", label: "Email Agent", icon: "✉️", path: "/ferramentas/emails" },
  { id: "excel", label: "Excel Tool", icon: "📊", path: "/ferramentas/excel" },
  { id: "whatsapp", label: "WhatsApp", icon: "💬", path: "/ferramentas/whatsapp" },
  { id: "projetos", label: "Projetos", icon: "📁", path: "/projetos" },
  { id: "anotacoes", label: "Anotações", icon: "📝", path: "/anotacoes" },
  { id: "arquivos", label: "Arquivos", icon: "📦", path: "/arquivos" },
  { id: "config", label: "Configurações", icon: "⚙️", path: "/config" },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return COMMANDS;
    return COMMANDS.filter((cmd) =>
      cmd.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const handleSelect = (path: string) => {
    navigate({ to: path as any });
    onClose();
    setSearch("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-border/50 flex items-center gap-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            autoFocus
            type="text"
            placeholder="Buscar páginas, ferramentas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground"
          />
          <span className="text-[10px] text-muted-foreground px-2 py-1 border border-border/30 rounded">
            ESC
          </span>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Nenhum resultado encontrado
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {filtered.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={() => handleSelect(cmd.path)}
                  className="w-full text-left px-4 py-3 hover:bg-surface-2 transition-colors flex items-center gap-3 group"
                >
                  <span className="text-lg">{cmd.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-brand">
                      {cmd.label}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border/50 bg-surface-2/30 text-[10px] text-muted-foreground/60">
          Pressione ESC para fechar • Digite para filtrar
        </div>
      </div>

      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-black/40 -z-10" />
    </div>
  );
}
