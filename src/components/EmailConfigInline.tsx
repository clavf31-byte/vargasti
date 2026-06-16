import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import type { EmailCategory, EmailWhitelist, EmailPriority, EmailBlacklist } from "@/hooks/useEmailConfig";

// ============================================
// INLINE CATEGORIAS
// ============================================
export function ConfigCategoriesInline({
  categories,
  onSave,
  onClose,
}: {
  categories: EmailCategory[];
  onSave: (categories: EmailCategory[]) => void;
  onClose: () => void;
}) {
  const [localCategories, setLocalCategories] = useState(categories);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newKeyword, setNewKeyword] = useState("");

  const addKeyword = (index: number) => {
    if (!newKeyword.trim()) return;
    const updated = [...localCategories];
    updated[index].keywords.push(newKeyword.toLowerCase());
    setLocalCategories(updated);
    setNewKeyword("");
  };

  const removeKeyword = (catIndex: number, keyIndex: number) => {
    const updated = [...localCategories];
    updated[catIndex].keywords.splice(keyIndex, 1);
    setLocalCategories(updated);
  };

  const handleSave = () => {
    onSave(localCategories);
    onClose();
  };

  const colors = ["bg-blue-500/20 text-blue-600 border-blue-200", "bg-teal-500/20 text-teal-600 border-teal-200", "bg-cyan-500/20 text-cyan-600 border-cyan-200"];

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-border bg-surface-2">
        <div>
          <h2 className="text-2xl font-bold text-foreground">📝 Categorias de E-mail</h2>
          <p className="text-sm text-muted-foreground mt-1">Organize e-mails por tipo automaticamente</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-surface rounded-lg transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
        {localCategories.map((cat, idx) => (
          <div key={idx} className="bg-surface border border-border rounded-xl p-4 hover:border-brand/50 transition">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 bg-brand rounded-full"></div>
              <h3 className="font-semibold text-foreground">{cat.name}</h3>
              <span className="ml-auto text-xs bg-brand/10 text-brand px-2 py-1 rounded">{cat.keywords.length} palavras</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {cat.keywords.map((kw, kidx) => (
                <div key={kidx} className={`${colors[kidx % 3]} border px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2`}>
                  {kw}
                  <button onClick={() => removeKeyword(idx, kidx)} className="hover:opacity-70 transition">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {editingIndex === idx ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="Digite a nova palavra-chave..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") addKeyword(idx);
                  }}
                  className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                />
                <button onClick={() => addKeyword(idx)} className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition text-sm font-medium">
                  Adicionar
                </button>
                <button onClick={() => setEditingIndex(null)} className="px-4 py-2 bg-surface-2 rounded-lg hover:bg-surface-3 transition text-sm font-medium">
                  Fechar
                </button>
              </div>
            ) : (
              <button onClick={() => setEditingIndex(idx)} className="w-full py-2 border border-dashed border-brand/30 rounded-lg hover:bg-brand/5 transition text-sm font-medium text-brand flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Adicionar Palavra-chave
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 p-6 border-t border-border bg-surface-2">
        <button onClick={handleSave} className="flex-1 py-3 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition font-semibold">
          Salvar Categorias
        </button>
        <button onClick={onClose} className="flex-1 py-3 bg-surface border border-border rounded-lg hover:bg-surface-2 transition font-semibold">
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ============================================
// INLINE BLACKLIST
// ============================================
export function ConfigBlacklistInline({
  blacklist,
  onSave,
  onClose,
}: {
  blacklist: EmailBlacklist[];
  onSave: (blacklist: EmailBlacklist[]) => void;
  onClose: () => void;
}) {
  const [localBlacklist, setLocalBlacklist] = useState(blacklist);
  const [newEmail, setNewEmail] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [newReason, setNewReason] = useState<"spam" | "fornecedor" | "dominio-bloqueado" | "outro">("spam");

  const addEntry = () => {
    if (!newEmail && !newDomain) return;
    const entry: EmailBlacklist = {
      id: Date.now().toString(),
      email: newEmail.toLowerCase(),
      domain: newDomain.toLowerCase(),
      reason: newReason,
    };
    setLocalBlacklist([...localBlacklist, entry]);
    setNewEmail("");
    setNewDomain("");
    setNewReason("spam");
  };

  const removeEntry = (id: string) => {
    setLocalBlacklist(localBlacklist.filter((b) => b.id !== id));
  };

  const handleSave = () => {
    onSave(localBlacklist);
    onClose();
  };

  const reasonColors = {
    spam: "bg-red-500/20 text-red-600 border-red-200",
    fornecedor: "bg-yellow-500/20 text-yellow-600 border-yellow-200",
    "dominio-bloqueado": "bg-orange-500/20 text-orange-600 border-orange-200",
    outro: "bg-slate-500/20 text-slate-600 border-slate-200",
  };

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-border bg-surface-2">
        <div>
          <h2 className="text-2xl font-bold text-foreground">🚫 Gerenciar Blacklist</h2>
          <p className="text-sm text-muted-foreground mt-1">Bloqueie e-mails de spam e fornecedores indesejados</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-surface rounded-lg transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
        {localBlacklist.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhuma entrada na blacklist</p>
        ) : (
          localBlacklist.map((entry) => (
            <div key={entry.id} className={`border rounded-lg p-4 ${reasonColors[entry.reason]}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  {entry.email && <p className="font-semibold text-sm">{entry.email}</p>}
                  {entry.domain && <p className="text-sm opacity-80">{entry.domain}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium capitalize">{entry.reason}</span>
                  <button onClick={() => removeEntry(entry.id)} className="p-1 hover:opacity-70 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        <div className="border-t border-border pt-4 mt-4">
          <h3 className="font-semibold text-foreground mb-3">Adicionar à Blacklist</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Email Específico (opcional)</label>
              <input
                type="email"
                placeholder="spam@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 bg-surface"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Domínio (opcional)</label>
              <input
                type="text"
                placeholder="spam.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 bg-surface"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Motivo do Bloqueio</label>
              <select
                value={newReason}
                onChange={(e) => setNewReason(e.target.value as typeof newReason)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 bg-surface"
              >
                <option value="spam">🚨 Spam</option>
                <option value="fornecedor">👤 Fornecedor Indesejado</option>
                <option value="dominio-bloqueado">🔒 Domínio Bloqueado</option>
                <option value="outro">❓ Outro</option>
              </select>
            </div>

            <button
              onClick={addEntry}
              className="w-full py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition text-sm font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Adicionar à Blacklist
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-3 p-6 border-t border-border bg-surface-2">
        <button onClick={handleSave} className="flex-1 py-3 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition font-semibold">
          Salvar Blacklist
        </button>
        <button onClick={onClose} className="flex-1 py-3 bg-surface border border-border rounded-lg hover:bg-surface-2 transition font-semibold">
          Cancelar
        </button>
      </div>
    </div>
  );
}
