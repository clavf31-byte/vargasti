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
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryKeywords, setNewCategoryKeywords] = useState("");

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

  const addNewCategory = () => {
    if (!newCategoryName.trim()) return;

    const keywords = newCategoryKeywords
      .split(",")
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 0);

    const newCategory: EmailCategory = {
      name: newCategoryName.trim(),
      keywords: keywords.length > 0 ? keywords : ["exemplo"],
    };

    setLocalCategories([...localCategories, newCategory]);
    setNewCategoryName("");
    setNewCategoryKeywords("");
    setShowNewCategoryForm(false);
  };

  const deleteCategory = (index: number) => {
    const updated = localCategories.filter((_, i) => i !== index);
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
        {/* Formulário para nova categoria */}
        {showNewCategoryForm && (
          <div className="bg-surface-2 border border-brand/30 rounded-xl p-4 space-y-3">
            <h4 className="font-semibold text-foreground">+ Criar Nova Categoria</h4>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Nome da Categoria</label>
              <input
                type="text"
                placeholder="ex: Telefonia"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 bg-surface"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Palavras-chave (separadas por vírgula)</label>
              <textarea
                placeholder="ex: telefone, ramal, VoIP, comunicação"
                value={newCategoryKeywords}
                onChange={(e) => setNewCategoryKeywords(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 bg-surface resize-none h-20"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={addNewCategory}
                className="flex-1 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition text-sm font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Criar Categoria
              </button>
              <button
                onClick={() => setShowNewCategoryForm(false)}
                className="flex-1 py-2 bg-surface-2 border border-border rounded-lg hover:bg-surface-3 transition text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {!showNewCategoryForm && (
          <button
            onClick={() => setShowNewCategoryForm(true)}
            className="w-full py-2 border border-dashed border-brand/30 rounded-lg hover:bg-brand/5 transition text-sm font-medium text-brand flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Criar Nova Categoria
          </button>
        )}

        {localCategories.map((cat, idx) => (
          <div key={idx} className="bg-surface border border-border rounded-xl p-4 hover:border-brand/50 transition">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 bg-brand rounded-full"></div>
              <h3 className="font-semibold text-foreground">{cat.name}</h3>
              <span className="ml-auto text-xs bg-brand/10 text-brand px-2 py-1 rounded">{cat.keywords.length} palavras</span>
              <button
                onClick={() => deleteCategory(idx)}
                className="p-1 hover:opacity-70 transition text-destructive"
                title="Deletar categoria"
              >
                <Trash2 className="w-4 h-4" />
              </button>
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
// INLINE WHITELIST
// ============================================
export function ConfigWhitelistInline({
  whitelist,
  onSave,
  onClose,
}: {
  whitelist: EmailWhitelist[];
  onSave: (whitelist: EmailWhitelist[]) => void;
  onClose: () => void;
}) {
  const [localWhitelist, setLocalWhitelist] = useState(whitelist);
  const [newEmail, setNewEmail] = useState("");
  const [newDomain, setNewDomain] = useState("");

  const addEntry = () => {
    if (!newEmail && !newDomain) return;
    const entry: EmailWhitelist = {
      id: Date.now().toString(),
      email: newEmail.toLowerCase().trim(),
      domain: newDomain.toLowerCase().trim().replace(/^@/, ""),
    };
    setLocalWhitelist([...localWhitelist, entry]);
    setNewEmail("");
    setNewDomain("");
  };

  const removeEntry = (id: string) => {
    setLocalWhitelist(localWhitelist.filter((w) => w.id !== id));
  };

  const handleSave = () => {
    onSave(localWhitelist);
    onClose();
  };

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-border bg-surface-2">
        <div>
          <h2 className="text-2xl font-bold text-foreground">✅ Gerenciar Whitelist</h2>
          <p className="text-sm text-muted-foreground mt-1">Apenas domínios e e-mails liberados serão processados</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-surface rounded-lg transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
        {localWhitelist.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhuma entrada na whitelist (todos os emails serão aceitos)</p>
        ) : (
          localWhitelist.map((entry) => (
            <div key={entry.id} className="border border-green-200 rounded-lg p-4 bg-green-500/10">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  {entry.email && <p className="font-semibold text-sm text-green-700">{entry.email}</p>}
                  {entry.domain && <p className="text-sm text-green-600 opacity-80">@{entry.domain}</p>}
                </div>
                <button onClick={() => removeEntry(entry.id)} className="p-1 hover:opacity-70 transition">
                  <Trash2 className="w-4 h-4 text-green-600" />
                </button>
              </div>
            </div>
          ))
        )}

        <div className="border-t border-border pt-4 mt-4">
          <h3 className="font-semibold text-foreground mb-3">Adicionar à Whitelist</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Email Específico (opcional)</label>
              <input
                type="email"
                placeholder="cliente@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 bg-surface"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Domínio (opcional)</label>
              <input
                type="text"
                placeholder="example.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 bg-surface"
              />
            </div>

            <button
              onClick={addEntry}
              className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Adicionar à Whitelist
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-3 p-6 border-t border-border bg-surface-2">
        <button onClick={handleSave} className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold">
          Salvar Whitelist
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
      email: newEmail.toLowerCase().trim(),
      domain: newDomain.toLowerCase().trim().replace(/^@/, ""),
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

// ============================================
// INLINE PRIORIDADES
// ============================================
export function ConfigPrioritiesInline({
  priorities,
  onSave,
  onClose,
}: {
  priorities: EmailPriority[];
  onSave: (priorities: EmailPriority[]) => void;
  onClose: () => void;
}) {
  const [localPriorities, setLocalPriorities] = useState(priorities);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState("");

  const updatePriority = (id: string, field: string, value: any) => {
    const updated = localPriorities.map((p) =>
      p.id === id ? { ...p, [field]: value } : p
    );
    setLocalPriorities(updated);
  };

  const addKeyword = (id: string) => {
    if (!newKeyword.trim()) return;
    const updated = localPriorities.map((p) =>
      p.id === id
        ? { ...p, keywords: [...p.keywords, newKeyword.toLowerCase()] }
        : p
    );
    setLocalPriorities(updated);
    setNewKeyword("");
  };

  const removeKeyword = (id: string, keyword: string) => {
    const updated = localPriorities.map((p) =>
      p.id === id
        ? { ...p, keywords: p.keywords.filter((k) => k !== keyword) }
        : p
    );
    setLocalPriorities(updated);
  };

  const handleSave = () => {
    onSave(localPriorities);
    onClose();
  };

  const priorityColors = {
    alta: "bg-red-500/20 border-red-200 text-red-700",
    media: "bg-yellow-500/20 border-yellow-200 text-yellow-700",
    baixa: "bg-blue-500/20 border-blue-200 text-blue-700",
  };

  const priorityBadges = {
    alta: "bg-red-100 text-red-800",
    media: "bg-yellow-100 text-yellow-800",
    baixa: "bg-blue-100 text-blue-800",
  };

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-border bg-surface-2">
        <div>
          <h2 className="text-2xl font-bold text-foreground">🎯 Regras de Prioridade</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure palavras-chave que definem urgência dos e-mails</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-surface rounded-lg transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
        {localPriorities.map((p) => (
          <div key={p.id} className={`border rounded-xl p-4 ${priorityColors[p.priority]}`}>
            <div className="flex items-center justify-between mb-3">
              <select
                value={p.priority}
                onChange={(e) => updatePriority(p.id, "priority", e.target.value)}
                className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${priorityBadges[p.priority]} border-0 cursor-pointer`}
              >
                <option value="alta">🔴 Alta</option>
                <option value="media">🟡 Média</option>
                <option value="baixa">🔵 Baixa</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {p.keywords.map((kw) => (
                <div key={kw} className={`${priorityBadges[p.priority]} px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2`}>
                  {kw}
                  <button onClick={() => removeKeyword(p.id, kw)} className="hover:opacity-70">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {editingId === p.id ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="Digite a palavra-chave..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") addKeyword(p.id);
                  }}
                  className="flex-1 px-3 py-2 border border-current border-opacity-30 rounded-lg text-sm focus:outline-none"
                />
                <button
                  onClick={() => addKeyword(p.id)}
                  className="px-3 py-2 bg-current bg-opacity-20 rounded-lg hover:bg-opacity-30 transition font-medium text-sm"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="px-3 py-2 bg-current bg-opacity-10 rounded-lg hover:bg-opacity-20 transition font-medium text-sm"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingId(p.id)}
                className="w-full py-2 border border-dashed border-current border-opacity-40 rounded-lg hover:bg-current hover:bg-opacity-10 transition font-medium text-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Adicionar Palavra-chave
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 p-6 border-t border-border bg-surface-2">
        <button
          onClick={handleSave}
          className="flex-1 py-3 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition font-semibold"
        >
          Salvar Prioridades
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-3 bg-surface border border-border rounded-lg hover:bg-surface-2 transition font-semibold"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
