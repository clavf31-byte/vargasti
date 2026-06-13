import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import type { EmailCategory, EmailWhitelist, EmailPriority, EmailBlacklist } from "@/hooks/useEmailConfig";

const ModalOverlay = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} className="bg-gradient-to-br from-surface to-surface-2 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-border">
      {children}
    </div>
  </div>
);

// ============================================
// MODAL CATEGORIAS
// ============================================
export function ConfigCategoriesModal({
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
    <ModalOverlay onClose={onClose}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground">📝 Categorias de E-mail</h2>
            <p className="text-sm text-muted-foreground mt-1">Organize e-mails por tipo automaticamente</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
    </ModalOverlay>
  );
}

// ============================================
// MODAL WHITELIST
// ============================================
export function ConfigWhitelistModal({
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
      email: newEmail.toLowerCase(),
      domain: newDomain.toLowerCase(),
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
    <ModalOverlay onClose={onClose}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground">👥 Clientes Permitidos</h2>
            <p className="text-sm text-muted-foreground mt-1">Autorize e-mails automaticamente por email ou domínio</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {localWhitelist.length > 0 ? (
            localWhitelist.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between bg-surface border border-border rounded-lg p-4 hover:border-info/50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-semibold text-info">✓</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{entry.email || `@${entry.domain}`}</p>
                    <p className="text-xs text-muted-foreground">{entry.email ? "Email específico" : "Domínio"}</p>
                  </div>
                </div>
                <button onClick={() => removeEntry(entry.id)} className="p-2 hover:bg-destructive/10 rounded-lg transition text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum cliente permitido ainda</p>
            </div>
          )}
        </div>

        <div className="border-t border-border p-6 bg-surface-2">
          <h3 className="font-semibold text-foreground mb-4">Adicionar Novo Cliente</h3>
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Email Específico (opcional)</label>
              <input type="email" placeholder="exemplo@empresa.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-info/50" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Domínio (opcional)</label>
              <input type="text" placeholder="empresa.com" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-info/50" />
            </div>
            <button onClick={addEntry} className="w-full py-2 bg-info text-info-foreground rounded-lg hover:bg-info/90 transition font-medium flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Adicionar Cliente
            </button>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-border">
          <button onClick={handleSave} className="flex-1 py-3 bg-info text-info-foreground rounded-lg hover:bg-info/90 transition font-semibold">
            Salvar Whitelist
          </button>
          <button onClick={onClose} className="flex-1 py-3 bg-surface border border-border rounded-lg hover:bg-surface-2 transition font-semibold">
            Cancelar
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ============================================
// MODAL PRIORIDADES
// ============================================
export function ConfigPrioritiesModal({
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

  const updatePriority = (id: string, field: string, value: string) => {
    const updated = localPriorities.map((p) => (p.id === id ? { ...p, [field]: value } : p));
    setLocalPriorities(updated);
  };

  const addKeyword = (id: string) => {
    if (!newKeyword.trim()) return;
    const updated = localPriorities.map((p) => (p.id === id ? { ...p, keywords: [...p.keywords, newKeyword.toLowerCase()] } : p));
    setLocalPriorities(updated);
    setNewKeyword("");
  };

  const removeKeyword = (id: string, keyword: string) => {
    const updated = localPriorities.map((p) => (p.id === id ? { ...p, keywords: p.keywords.filter((k) => k !== keyword) } : p));
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
    <ModalOverlay onClose={onClose}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground">🎯 Regras de Prioridade</h2>
            <p className="text-sm text-muted-foreground mt-1">Configure palavras-chave que definem urgência</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                  <button onClick={() => addKeyword(p.id)} className="px-3 py-2 bg-current bg-opacity-20 rounded-lg hover:bg-opacity-30 transition font-medium text-sm">
                    Adicionar
                  </button>
                  <button onClick={() => setEditingId(null)} className="px-3 py-2 bg-current bg-opacity-10 rounded-lg hover:bg-opacity-20 transition font-medium text-sm">
                    Fechar
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditingId(p.id)} className="w-full py-2 border border-dashed border-current border-opacity-40 rounded-lg hover:bg-current hover:bg-opacity-10 transition font-medium text-sm flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Adicionar Palavra-chave
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 p-6 border-t border-border bg-surface-2">
          <button onClick={handleSave} className="flex-1 py-3 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition font-semibold">
            Salvar Prioridades
          </button>
          <button onClick={onClose} className="flex-1 py-3 bg-surface border border-border rounded-lg hover:bg-surface-2 transition font-semibold">
            Cancelar
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ============================================
// MODAL BLACKLIST
// ============================================
export function ConfigBlacklistModal({
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

  const reasonIcons = {
    spam: "🚨",
    fornecedor: "🏢",
    "dominio-bloqueado": "🔒",
    outro: "❓",
  };

  const reasonLabels = {
    spam: "SPAM",
    fornecedor: "Fornecedor",
    "dominio-bloqueado": "Domínio Bloqueado",
    outro: "Outro",
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b border-destructive/30 bg-destructive/5">
          <div>
            <h2 className="text-2xl font-bold text-destructive">🚫 Gerenciar Blacklist</h2>
            <p className="text-sm text-muted-foreground mt-1">Bloqueie e-mails de spam e fornecedores indesejados</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-destructive/10 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {localBlacklist.length > 0 ? (
            localBlacklist.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between bg-destructive/5 border border-destructive/30 rounded-lg p-4 hover:border-destructive/60 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-destructive/20 rounded-lg flex items-center justify-center text-lg">{reasonIcons[entry.reason]}</div>
                  <div>
                    <p className="font-medium text-foreground">{entry.email || `@${entry.domain}`}</p>
                    <p className="text-xs text-muted-foreground">{reasonLabels[entry.reason]}</p>
                  </div>
                </div>
                <button onClick={() => removeEntry(entry.id)} className="p-2 hover:bg-destructive/20 rounded-lg transition text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma entrada na blacklist</p>
            </div>
          )}
        </div>

        <div className="border-t border-destructive/30 p-6 bg-destructive/5">
          <h3 className="font-semibold text-foreground mb-4">Adicionar à Blacklist</h3>
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Email Específico (opcional)</label>
              <input type="email" placeholder="spam@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full px-4 py-2 border border-destructive/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-destructive/50" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Domínio (opcional)</label>
              <input type="text" placeholder="spam.com" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} className="w-full px-4 py-2 border border-destructive/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-destructive/50" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Motivo do Bloqueio</label>
              <select
                value={newReason}
                onChange={(e) => setNewReason(e.target.value as any)}
                className="w-full px-4 py-2 bg-surface text-foreground border border-destructive/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-destructive/50"
              >
                <option value="spam">🚨 SPAM</option>
                <option value="fornecedor">🏢 Fornecedor</option>
                <option value="dominio-bloqueado">🔒 Domínio Bloqueado</option>
                <option value="outro">❓ Outro</option>
              </select>
            </div>
            <button onClick={addEntry} className="w-full py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition font-medium flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Adicionar à Blacklist
            </button>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-destructive/30">
          <button onClick={handleSave} className="flex-1 py-3 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition font-semibold">
            Salvar Blacklist
          </button>
          <button onClick={onClose} className="flex-1 py-3 bg-surface border border-border rounded-lg hover:bg-surface-2 transition font-semibold">
            Cancelar
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
