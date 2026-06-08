import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Files, Download, Trash2, FileSpreadsheet, FileText, File } from "lucide-react";

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
  if (type.includes("sheet") || type.includes("excel") || type === "csv") return FileSpreadsheet;
  if (type.includes("text") || type.includes("pdf") || type.includes("doc")) return FileText;
  return File;
}

function formatBytes(bytes?: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ArquivosPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [search, setSearch] = useState("");

  // Also load Excel import history from localStorage as supplemental data
  const [excelHistory] = useState<FileRecord[]>(() => {
    try {
      const h = JSON.parse(localStorage.getItem("excel-history") || "[]");
      return h.map((item: any) => ({
        id: `local-${item.id}`,
        name: item.fileName,
        file_type: item.fileName.endsWith(".csv") ? "csv" : "xlsx",
        origin: "Excel Tool",
        size_bytes: undefined,
        storage_path: undefined,
        created_at: item.importedAt,
      }));
    } catch { return []; }
  });

  useEffect(() => {
    if (user) load();
  }, [user]);

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
    if (id.startsWith("local-")) return;
    await supabase.from("file_records").delete().eq("id", id).eq("user_id", user!.id);
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  const allFiles = [...files, ...excelHistory].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const filtered = allFiles.filter((f) =>
    search === "" || f.name.toLowerCase().includes(search.toLowerCase()) || f.origin.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="p-4 md:p-5 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">Arquivos</div>
            <h1 className="text-sm text-foreground">Central de Arquivos</h1>
          </div>
          <div className="text-[9px] text-muted-foreground">{filtered.length} arquivo(s)</div>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar arquivos..."
          className="bg-surface border border-border rounded px-2 py-1.5 text-[10px] focus:outline-none focus:border-brand/50 placeholder:text-muted-foreground w-56"
        />

        {loading ? (
          <p className="text-[10px] text-muted-foreground py-6 text-center">Carregando...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Files className="size-8 mx-auto mb-2 opacity-20" />
            <p className="text-[10px]">Nenhum arquivo encontrado</p>
            <p className="text-[9px] mt-1">Use o Excel Tool para importar planilhas — elas aparecerão aqui</p>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-surface-2 border-b border-border">
                <tr>
                  <th className="px-3 py-2 text-[9px] text-muted-foreground uppercase tracking-wider">Nome</th>
                  <th className="px-3 py-2 text-[9px] text-muted-foreground uppercase tracking-wider">Tipo</th>
                  <th className="px-3 py-2 text-[9px] text-muted-foreground uppercase tracking-wider">Origem</th>
                  <th className="px-3 py-2 text-[9px] text-muted-foreground uppercase tracking-wider">Tamanho</th>
                  <th className="px-3 py-2 text-[9px] text-muted-foreground uppercase tracking-wider">Data</th>
                  <th className="px-3 py-2 text-[9px] text-muted-foreground uppercase tracking-wider w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((f) => {
                  const Icon = getFileIcon(f.file_type);
                  return (
                    <tr key={f.id} className="hover:bg-surface-2 transition-colors group">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Icon className="size-3 text-brand shrink-0" />
                          <span className="text-[10px] text-foreground truncate max-w-[200px]">{f.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[9px] text-muted-foreground uppercase">{f.file_type}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[9px] text-muted-foreground">{f.origin}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[9px] text-muted-foreground">{formatBytes(f.size_bytes)}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[9px] text-muted-foreground">
                          {new Date(f.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {f.storage_path && (
                            <button className="p-1 rounded text-muted-foreground hover:text-brand hover:bg-brand/10 transition-colors">
                              <Download className="size-3" />
                            </button>
                          )}
                          {!f.id.startsWith("local-") && (
                            <button onClick={() => deleteFile(f.id)} className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
                              <Trash2 className="size-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {dbError && (
          <p className="text-[9px] text-muted-foreground text-center">
            Tabela <code className="text-brand">file_records</code> não configurada — exibindo apenas histórico local do Excel Tool.
          </p>
        )}
      </div>
    </AppShell>
  );
}
