import React, { useState } from "react";
import { X, Plus } from "lucide-react";
import { colors, spacing, borderRadius } from "@/lib/colors";

interface ClienteTagsInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

const TAGS_SUGERIDAS = [
  "VIP",
  "Inadimplente",
  "Prospect",
  "Ativo",
  "Inativo",
  "Concorrente",
  "Referência",
];

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
    <div style={{ marginBottom: spacing.lg }}>
      <label
        style={{
          display: "block",
          fontSize: "14px",
          color: colors.textSecondary,
          marginBottom: spacing.sm,
          fontWeight: 600,
        }}
      >
        Tags / Segmentação
      </label>

      {/* Tags */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: spacing.sm,
          marginBottom: spacing.sm,
          minHeight: "32px",
          alignItems: "center",
        }}
      >
        {tags.map((tag, idx) => (
          <div
            key={idx}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: spacing.xs,
              padding: `4px ${spacing.sm}`,
              background: colors.info,
              color: "#fff",
              borderRadius: borderRadius.sm,
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {tag}
            <button
              onClick={() => handleRemoveTag(idx)}
              style={{
                background: "transparent",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ position: "relative", marginBottom: spacing.sm }}>
        <div style={{ display: "flex", gap: spacing.sm }}>
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowSugestoes(true);
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTag(input);
              }
            }}
            placeholder="Digite uma tag e pressione Enter"
            style={{
              flex: 1,
              padding: spacing.md,
              background: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.md,
              color: colors.text,
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={() => handleAddTag(input)}
            style={{
              padding: `${spacing.md} ${spacing.lg}`,
              background: colors.info,
              border: "none",
              borderRadius: borderRadius.md,
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: spacing.sm,
            }}
          >
            <Plus size={16} />
            Adicionar
          </button>
        </div>

        {/* Sugestões */}
        {showSugestoes && input.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              marginTop: spacing.sm,
              background: colors.backgroundSecondary,
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.md,
              zIndex: 10,
              maxHeight: "150px",
              overflowY: "auto",
            }}
          >
            {TAGS_SUGERIDAS.filter((tag) =>
              tag.toUpperCase().includes(input.toUpperCase())
            ).map((tag) => (
              <button
                key={tag}
                onClick={() => handleAddTag(tag)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: spacing.md,
                  background: "transparent",
                  border: "none",
                  textAlign: "left",
                  color: colors.text,
                  cursor: "pointer",
                  fontSize: "13px",
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tags Sugeridas */}
      {!input && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm }}>
          {TAGS_SUGERIDAS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleAddTag(tag)}
              style={{
                padding: `4px ${spacing.sm}`,
                background: "transparent",
                border: `1px dashed ${colors.border}`,
                borderRadius: borderRadius.sm,
                color: colors.textSecondary,
                cursor: "pointer",
                fontSize: "12px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = colors.info;
                (e.currentTarget as HTMLElement).style.color = colors.info;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = colors.border;
                (e.currentTarget as HTMLElement).style.color = colors.textSecondary;
              }}
            >
              + {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
