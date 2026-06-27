import React from "react";
import { X, Plus } from "lucide-react";

interface ClienteTagsInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

const TAGS_SUGERIDAS = ["VIP", "Inadimplente", "Prospect", "Ativo", "Inativo", "Concorrente", "Referência"];

export function ClienteTagsInput({ tags, onChange }: ClienteTagsInputProps) {
  const [input, setInput] = React.useState("");
  const [showSugestoes, setShowSugestoes] = React.useState(false);

  const handleAddTag = (tag: string) => {
    const normalized = tag.trim().toUpperCase();
    if (normalized && !tags.includes(normalized)) {
      onChange([...tags, normalized]);
      setInput("");
      setShowSugestoes(false);
    }
  };

  const handleRemoveTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="mb-4 space-y-2">
      <label className="block text-xs font-semibold text-muted-foreground">Tags / Segmentação</label>

      <div className="flex flex-wrap gap-1.5 min-h-8 items-center">
        {tags.map((tag, idx) => (
          <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-info text-white rounded text-xs font-semibold">
            {tag}
            <button onClick={() => handleRemoveTag(idx)} className="text-white/80 hover:text-white">
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>

      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setShowSugestoes(true); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(input); } }}
            placeholder="Digite uma tag e pressione Enter"
            className="input-base flex-1"
          />
          <button
            type="button"
            onClick={() => handleAddTag(input)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-info text-white text-sm font-semibold rounded-lg hover:bg-info/90 transition-colors"
          >
            <Plus className="size-3.5" /> Adicionar
          </button>
        </div>

        {showSugestoes && input.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg z-10 max-h-36 overflow-y-auto shadow-lg">
            {TAGS_SUGERIDAS.filter((tag) => tag.toUpperCase().includes(input.toUpperCase())).map((tag) => (
              <button
                key={tag}
                onClick={() => handleAddTag(tag)}
                className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-surface-2 border-b border-border/50 last:border-0 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {!input && (
        <div className="flex flex-wrap gap-1.5">
          {TAGS_SUGERIDAS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleAddTag(tag)}
              className="px-2 py-0.5 border border-dashed border-border text-muted-foreground rounded text-xs hover:border-info hover:text-info transition-colors"
            >
              + {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
