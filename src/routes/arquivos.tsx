import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Files, Download, Trash2, FileSpreadsheet, FileText, File, ExternalLink, Search,
} from "lucide-react";

export const Route = createFileRoute("/arquivos")({
  head: () => ({ meta: [{ title: "Arquivos · VargasTI Lab" }] }),
  component: ArquivosPage,
});

type FileRecord = {
  id: string;
  name: string;
  file_type: string;
  origin: string;
  size_bytes?: number;
  storage_path?: string;
  created_at: string;
};

function getFileIcon(type: string) {
  if (type.includes("sheet") || type.includes("excel") || type === "csv" || type === "xlsx")
    return FileSpreadsheet;
  if (type.includes("text") || type.includes("pdf") || type.includes("doc")) return FileText;
  return File;
}

function getFileColor(type: string) {
  if (type === "xlsx" || type.includes("sheet") || type.includes("excel")) return "text-warning";
  if (type === "csv") return "text-brand";
  if (type.includes("pdf")) return "text-destructive";
  return "text-info";
}

function formatBytes(bytes?: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isExcelFile(type: string) {
  return type === "xlsx" || type === "csv" || type.includes("sheet") || type.includes("excel");
}

function ArquivosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [search, setSearch] = useState("");
  const [localHistory, setLocalHistory] = useState<FileRecord[]>([]);

  useEffect(() => {
    loadLocal();
    if (user) load();
  }, [user]);

  function loadLocal() {
    try {
      const h = JSON.parse(localStorage.getItem("excel-history") || "[]");
      setLocalHistory(
        h.map((item: Record<string, unknown>) => ({
          id: `local-${item.id}`,
          name: item.fileName,
          file_type: String(item.fileName).endsWith(".csv") ? "csv" : "xlsx",
          origin: "Excel Tool",
          size_bytes: undefined,
          storage_path: undefined,
          created_at: item.importedAt,
        })),
      );
    } catch {
      setLocalHistory([]);
    }
  }

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("file_records")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (error && error.code !== "42P01") {
      setDbError(true);
    } else {
      setFiles((data ?? []) as FileRecord[]);
    }
    setLoading(false);
  }

  async function deleteFile(id: string) {
    if (id.startsWith("local-")) {
      const rawId = id.replace("local-", "");
      try {
        const h = JSON.parse(localStorage.getItem("excel-history") || "[]");
        const updated = h.filter((item: Record<string, unknown>) => String(item.id) !== rawId);
        localStorage.setItem("excel-history", JSON.stringify(updated));
        setLocalHistory((prev) => prev.filter((f) => f.id !== id));
      } catch {
        /* ignore */
      }
      return;
    }
    const file = files.find((f) => f.id === id);
    if (file?.storage_path) {
      await supabase.storage.from("uploads").remove([file.storage_path]);
    }
    await supabase.from("file_records").delete().eq("id", id).eq("user_id", user!.id);
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function downloadFile(f: FileRecord) {
    if (!f.storage_path) return;
    if (f.storage_path.startsWith("http")) {
      window.open(f.storage_path, "_blank");
      return;
    }
    const { data } = await supabase.storage.from("uploads").createSignedUrl(f.storage_path, 3600);
    if (data?.signedUrl) {
      const a = document.createElement("a");
      a.href = data.signedUrl;
      a.download = f.name;
      a.click();
    }
  }

  const allFiles = [...files, ...localHistory].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const filtered = allFiles.filter(
    (f) =>
      search === "" ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.origin.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AppShell>
      <div className="p-4 md:p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Storage</p>
            <h1 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
              <Files className="size-4 text-warning" />
              Central de Arquivos
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {allFiles.length} arquivo{allFiles.length !== 1 ? "s" : ""} registrado{allFiles.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar arquivos..."
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand/40 focus:ring-1 focus:ring-brand/20 transition-all"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="size-12 rounded-2xl bg-surface border border-border grid place-items-center">
              <Files className="size-5 text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Nenhum arquivo encontrado</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                Use o Excel Tool para importar planilhas — elas aparecerão aqui
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-2/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Nome</th>
                    <th className="px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium hidden sm:table-cell">Tipo</th>
                    <th className="px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium hidden md:table-cell">Origem</th>
                    <th className="px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium hidden lg:table-cell">Tamanho</th>
                    <th className="px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium hidden sm:table-cell">Data</th>
                    <th className="px-4 py-2.5 w-24" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filtered.map((f) => {
                    const Icon = getFileIcon(f.file_type);
                    const iconColor = getFileColor(f.file_type);
                    const canDownload = !!f.storage_path;
                    const canOpen = isExcelFile(f.file_type);
                    const isLocal = f.id.startsWith("local-");
                    return (
                      <tr key={f.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`size-7 rounded-lg bg-surface-2 border border-border grid place-items-center shrink-0 ${iconColor}`}>
                              <Icon className="size-3.5" />
                            </div>
                            <span className="text-sm text-foreground truncate max-w-[180px] font-medium">{f.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-[10px] text-muted-foreground uppercase font-medium bg-surface-2 border border-border rounded px-1.5 py-0.5">
                            {f.file_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-[11px] text-muted-foreground">{f.origin}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-[11px] text-muted-foreground">{formatBytes(f.size_bytes)}</span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(f.created_at).toLocaleDateString("pt-BR")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                            {canOpen && (
                              <button
                                onClick={() => navigate({ to: "/ferramentas/excel" })}
                                title="Abrir no Editor Excel"
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-brand hover:bg-brand/10 transition-colors"
                              >
                                <ExternalLink className="size-3.5" />
                              </button>
                            )}
                            {canDownload && (
                              <button
                                onClick={() => downloadFile(f)}
                                title="Baixar arquivo"
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-brand hover:bg-brand/10 transition-colors"
                              >
                                <Download className="size-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteFile(f.id)}
                              title={isLocal ? "Remover do histórico" : "Excluir arquivo"}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <p className="text-[10px] text-muted-foreground text-right">
            {filtered.length} de {allFiles.length} arquivo{allFiles.length !== 1 ? "s" : ""}
          </p>
        )}

        {dbError && (
          <p className="text-[10px] text-muted-foreground text-center">
            Tabela <code className="text-brand">file_records</code> não configurada — exibindo apenas histórico local.
          </p>
        )}
      </div>
    </AppShell>
  );
}
