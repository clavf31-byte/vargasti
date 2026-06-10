import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type AnthropicTool = {
  name: string;
  description: string;
  input_schema: { type: "object"; properties: Record<string, unknown>; required?: string[] };
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnthropicMessage = any;
type AnthropicToolResult = { type: "tool_result"; tool_use_id: string; content: string };

const MAX_PREVIEW_ROWS = 200;

export type FilterSpec = {
  id: string;
  col: number;
  type: "text" | "number" | "date";
  operator: string;
  value: string;
};

export type AgentAction =
  | { type: "sort"; colIndex: number; direction: "asc" | "desc" }
  | { type: "filter"; filters: FilterSpec[]; logic: "AND" | "OR" }
  | { type: "clear_filters" }
  | { type: "add_column"; name: string; values: string[] }
  | { type: "update_cells"; changes: { row: number; col: number; value: string }[] }
  | { type: "switch_sheet"; sheetName: string }
  | { type: "summarize" };

const RequestSchema = z.object({
  headers: z.array(z.string()),
  types: z.array(z.enum(["text", "number", "date"])),
  rows: z.array(z.array(z.string())),
  totalRows: z.number(),
  message: z.string().min(1).max(3000),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .max(20),
  activeSheet: z.string().optional(),
  allSheets: z
    .array(z.object({ name: z.string(), rows: z.number(), cols: z.number() }))
    .optional(),
});

export const runExcelAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(RequestSchema)
  .handler(async ({ data }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada no servidor.");

    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });

    const { headers, types, rows, totalRows, message, history, activeSheet, allSheets } = data;
    const previewRows = rows.slice(0, MAX_PREVIEW_ROWS);

    const colMeta = headers
      .map((h, i) => `  [${i}] "${h}" — ${types[i] ?? "text"}`)
      .join("\n");

    const tablePreview = [
      headers.join(" | "),
      headers.map(() => "---").join(" | "),
      ...previewRows.map((r) => r.map((v) => v || "(vazio)").join(" | ")),
    ].join("\n");

    const truncNote =
      totalRows > MAX_PREVIEW_ROWS
        ? `\nATENÇÃO: A planilha tem ${totalRows} linhas; apenas as primeiras ${MAX_PREVIEW_ROWS} estão disponíveis. Para add_column, forneça exatamente ${previewRows.length} valores.`
        : "";

    const sheetsMeta = allSheets && allSheets.length > 1
      ? `\nAbas disponíveis no arquivo:\n${allSheets.map((s) => `  - "${s.name}": ${s.rows} linhas × ${s.cols} colunas`).join("\n")}\nAba ativa: "${activeSheet ?? "desconhecida"}"`
      : "";

    const system = `Você é um assistente de análise e manipulação de planilhas. Responda sempre em português brasileiro.
${sheetsMeta}

Colunas da aba ativa:
${colMeta}
${truncNote}

Dados da aba ativa (${previewRows.length} linhas):
${tablePreview}

Use as ferramentas para executar ações na planilha. Após executar, confirme o que foi feito de forma resumida.
- Para trocar de aba, use switch_sheet.
- Para listar abas, use list_sheets.
- Para resumo estatístico, use summarize_data.`;

    const tools: AnthropicTool[] = [
      {
        name: "sort_data",
        description: "Ordenar os dados por uma coluna",
        input_schema: {
          type: "object" as const,
          properties: {
            column_name: { type: "string", description: "Nome exato da coluna" },
            direction: { type: "string", enum: ["asc", "desc"] },
          },
          required: ["column_name", "direction"],
        },
      },
      {
        name: "filter_data",
        description: "Filtrar linhas por condições. Operadores de texto: contains, not_contains, equals, not_equals, starts_with, ends_with, empty, not_empty. Operadores numéricos: gt, lt, equals.",
        input_schema: {
          type: "object" as const,
          properties: {
            conditions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  column_name: { type: "string" },
                  operator: {
                    type: "string",
                    enum: [
                      "contains", "not_contains", "equals", "not_equals",
                      "starts_with", "ends_with", "empty", "not_empty",
                      "gt", "lt",
                    ],
                  },
                  value: { type: "string" },
                },
                required: ["column_name", "operator"],
              },
            },
            logic: { type: "string", enum: ["AND", "OR"] },
          },
          required: ["conditions", "logic"],
        },
      },
      {
        name: "clear_filters",
        description: "Remover todos os filtros ativos e mostrar todas as linhas",
        input_schema: { type: "object" as const, properties: {} },
      },
      {
        name: "add_column",
        description: `Adicionar nova coluna calculada. O array values deve ter exatamente ${previewRows.length} elementos (um por linha).`,
        input_schema: {
          type: "object" as const,
          properties: {
            column_name: { type: "string" },
            values: { type: "array", items: { type: "string" } },
          },
          required: ["column_name", "values"],
        },
      },
      {
        name: "update_cells",
        description: "Atualizar valores de células específicas. O índice de linha começa em 0.",
        input_schema: {
          type: "object" as const,
          properties: {
            changes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  row: { type: "number" },
                  column_name: { type: "string" },
                  value: { type: "string" },
                },
                required: ["row", "column_name", "value"],
              },
            },
          },
          required: ["changes"],
        },
      },
      {
        name: "switch_sheet",
        description: "Trocar a aba ativa da planilha. Use quando o usuário pedir para abrir, ver ou trabalhar em outra aba.",
        input_schema: {
          type: "object" as const,
          properties: {
            sheet_name: { type: "string", description: "Nome exato da aba (case-sensitive)" },
          },
          required: ["sheet_name"],
        },
      },
      {
        name: "list_sheets",
        description: "Listar todas as abas do arquivo com nome, número de linhas e colunas. Use quando o usuário perguntar quais abas existem.",
        input_schema: { type: "object" as const, properties: {} },
      },
      {
        name: "summarize_data",
        description: "Gerar resumo estatístico da aba ativa: total de linhas, colunas, contagem de valores únicos, mínimo/máximo/média para colunas numéricas.",
        input_schema: { type: "object" as const, properties: {} },
      },
    ];

    const messages: AnthropicMessage[] = [
      ...history.map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
      { role: "user", content: message },
    ];

    const actions: AgentAction[] = [];
    let finalText = "";

    let resp = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      system,
      tools,
      messages,
    });

    while (resp.stop_reason === "tool_use") {
      const results: AnthropicToolResult[] = [];

      for (const block of resp.content) {
        if (block.type !== "tool_use") continue;
        const input = block.input as Record<string, unknown>;
        const action = buildAction(block.name, input, headers, types, previewRows.length);
        if (action) actions.push(action);

        let toolResultContent = "OK";
        if (block.name === "list_sheets" && allSheets) {
          toolResultContent = allSheets
            .map((s) => `- "${s.name}": ${s.rows} linhas × ${s.cols} colunas`)
            .join("\n");
        } else if (block.name === "summarize_data") {
          const numCols = headers.filter((_, i) => types[i] === "number");
          const stats = headers
            .map((h, i) => {
              if (types[i] !== "number") {
                const unique = new Set(previewRows.map((r) => r[i] ?? "").filter(Boolean)).size;
                return `${h}: ${unique} valores únicos`;
              }
              const nums = previewRows
                .map((r) => parseFloat((r[i] ?? "").replace(",", ".")))
                .filter((n) => !isNaN(n));
              if (nums.length === 0) return `${h}: sem dados`;
              const sum = nums.reduce((a, b) => a + b, 0);
              return `${h}: min=${Math.min(...nums)}, max=${Math.max(...nums)}, média=${(sum / nums.length).toFixed(2)}`;
            })
            .join("\n");
          toolResultContent = `Total: ${previewRows.length} linhas, ${headers.length} colunas\n${stats}`;
          void numCols;
        }

        results.push({ type: "tool_result", tool_use_id: block.id, content: toolResultContent });
      }

      messages.push({ role: "assistant", content: resp.content });
      messages.push({ role: "user", content: results });

      resp = await client.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 4096,
        system,
        tools,
        messages,
      });
    }

    for (const block of resp.content) {
      if (block.type === "text") finalText += block.text;
    }

    return { text: finalText.trim(), actions };
  });

function buildAction(
  name: string,
  input: Record<string, unknown>,
  headers: string[],
  types: string[],
  numRows: number,
): AgentAction | null {
  const colIdx = (colName: string) => headers.findIndex((h) => h === colName);
  const uid = () => Math.random().toString(36).slice(2);

  switch (name) {
    case "sort_data": {
      const idx = colIdx(input.column_name as string);
      if (idx === -1) return null;
      return { type: "sort", colIndex: idx, direction: (input.direction as "asc" | "desc") ?? "asc" };
    }

    case "filter_data": {
      const conditions =
        (input.conditions as Array<{ column_name: string; operator: string; value?: string }>) ?? [];
      const filters: FilterSpec[] = [];
      for (const c of conditions) {
        const idx = colIdx(c.column_name);
        if (idx === -1) continue;
        filters.push({
          id: `agent-${uid()}`,
          col: idx,
          type: (types[idx] ?? "text") as "text" | "number" | "date",
          operator: c.operator,
          value: c.value ?? "",
        });
      }
      if (filters.length === 0) return null;
      return { type: "filter", filters, logic: (input.logic as "AND" | "OR") ?? "AND" };
    }

    case "clear_filters":
      return { type: "clear_filters" };

    case "add_column": {
      const raw = (input.values as string[]) ?? [];
      const values = Array.from({ length: numRows }, (_, i) => raw[i] ?? "");
      return { type: "add_column", name: (input.column_name as string) ?? "Nova Coluna", values };
    }

    case "update_cells": {
      const changes =
        (input.changes as Array<{ row: number; column_name: string; value: string }>) ?? [];
      const mapped = changes.flatMap((c) => {
        const col = colIdx(c.column_name);
        if (col === -1) return [];
        return [{ row: c.row, col, value: c.value }];
      });
      if (mapped.length === 0) return null;
      return { type: "update_cells", changes: mapped };
    }

    case "switch_sheet": {
      const sheetName = (input.sheet_name as string) ?? "";
      if (!sheetName) return null;
      return { type: "switch_sheet", sheetName };
    }

    case "list_sheets":
      return null;

    case "summarize_data":
      return null;

    default:
      return null;
  }
}
