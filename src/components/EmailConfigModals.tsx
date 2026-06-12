import { useState } from "react";
import type { EmailCategory, EmailWhitelist, EmailPriority } from "@/hooks/useEmailConfig";

// Modal Categorias
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto p-6">
        <h2 className="text-xl font-bold mb-4">Gerenciar Categorias</h2>

        <div className="space-y-4">
          {localCategories.map((cat, idx) => (
            <div key={idx} className="border rounded p-3">
              <h3 className="font-semibold mb-2">{cat.name}</h3>
              <div className="flex flex-wrap gap-2 mb-2">
                {cat.keywords.map((kw, kidx) => (
                  <span
                    key={kidx}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-1"
                  >
                    {kw}
                    <button
                      onClick={() => removeKeyword(idx, kidx)}
                      className="text-red-600 hover:text-red-800 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {editingIndex === idx ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nova palavra-chave"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    className="flex-1 px-2 py-1 border rounded text-sm"
                  />
                  <button
                    onClick={() => addKeyword(idx)}
                    className="px-2 py-1 bg-green-500 text-white rounded text-sm"
                  >
                    Adicionar
                  </button>
                  <button
                    onClick={() => setEditingIndex(null)}
                    className="px-2 py-1 bg-gray-300 rounded text-sm"
                  >
                    Fechar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingIndex(idx)}
                  className="text-sm px-2 py-1 bg-blue-500 text-white rounded"
                >
                  + Adicionar Palavra
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 py-2 bg-green-600 text-white rounded font-semibold"
          >
            Salvar
          </button>
          <button onClick={onClose} className="flex-1 py-2 bg-gray-300 rounded font-semibold">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal Clientes Permitidos
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto p-6">
        <h2 className="text-xl font-bold mb-4">Clientes Permitidos</h2>

        <div className="space-y-2 mb-4">
          {localWhitelist.map((entry) => (
            <div key={entry.id} className="flex justify-between items-center border p-2 rounded">
              <span className="text-sm">
                {entry.email || `@${entry.domain}`}
              </span>
              <button
                onClick={() => removeEntry(entry.id)}
                className="text-red-600 hover:text-red-800 font-bold"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Adicionar Cliente</h3>
          <div className="space-y-2">
            <input
              type="email"
              placeholder="Email específico (opcional)"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
            />
            <input
              type="text"
              placeholder="Domínio (exemplo: company.com)"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
            />
            <button
              onClick={addEntry}
              className="w-full py-1 bg-green-500 text-white rounded text-sm"
            >
              Adicionar
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 py-2 bg-green-600 text-white rounded font-semibold"
          >
            Salvar
          </button>
          <button onClick={onClose} className="flex-1 py-2 bg-gray-300 rounded font-semibold">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal Prioridades
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

  const updatePriority = (id: string, field: string, value: string) => {
    const updated = localPriorities.map((p) => (p.id === id ? { ...p, [field]: value } : p));
    setLocalPriorities(updated);
  };

  const addKeyword = (id: string, keyword: string) => {
    if (!keyword.trim()) return;
    const updated = localPriorities.map((p) =>
      p.id === id ? { ...p, keywords: [...p.keywords, keyword.toLowerCase()] } : p
    );
    setLocalPriorities(updated);
  };

  const removeKeyword = (id: string, keyword: string) => {
    const updated = localPriorities.map((p) =>
      p.id === id ? { ...p, keywords: p.keywords.filter((k) => k !== keyword) } : p
    );
    setLocalPriorities(updated);
  };

  const handleSave = () => {
    onSave(localPriorities);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto p-6">
        <h2 className="text-xl font-bold mb-4">Regras de Prioridade</h2>

        <div className="space-y-3">
          {localPriorities.map((p) => (
            <div key={p.id} className="border rounded p-3">
              <div className="flex gap-2 mb-2">
                <select
                  value={p.priority}
                  onChange={(e) => updatePriority(p.id, "priority", e.target.value)}
                  className="px-2 py-1 border rounded text-sm font-semibold"
                >
                  <option value="alta">Alta</option>
                  <option value="media">Média</option>
                  <option value="baixa">Baixa</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-1 mb-2">
                {p.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs flex items-center gap-1"
                  >
                    {kw}
                    <button
                      onClick={() => removeKeyword(p.id, kw)}
                      className="text-red-600 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <input
                type="text"
                placeholder="Nova palavra-chave"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    addKeyword(p.id, e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 py-2 bg-green-600 text-white rounded font-semibold"
          >
            Salvar
          </button>
          <button onClick={onClose} className="flex-1 py-2 bg-gray-300 rounded font-semibold">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
