import { useState, type ReactNode, type FormEvent } from "react";

export type OSFormValues = {
  descricao: string;
  solucao: string;
  prioridade: "baixa" | "normal" | "alta";
  data_inicio: string;
  tecnico: string;
};

type OSFormProps = {
  /** Valores iniciais (edição ou pré-preenchimento na conversão). */
  initial?: Partial<OSFormValues>;
  /** Campos extras renderizados no topo do grid (ex: seletor de cliente na OS avulsa). */
  children?: ReactNode;
  /** Trava o submit enquanto os campos extras não estão válidos. */
  canSubmit?: boolean;
  submitLabel?: string;
  saving?: boolean;
  onSubmit: (values: OSFormValues) => void;
  onCancel: () => void;
};

const hoje = () => new Date().toISOString().split("T")[0];

export function OSForm({
  initial,
  children,
  canSubmit = true,
  submitLabel = "Criar OS",
  saving = false,
  onSubmit,
  onCancel,
}: OSFormProps) {
  const [form, setForm] = useState<OSFormValues>({
    descricao: initial?.descricao ?? "",
    solucao: initial?.solucao ?? "",
    prioridade: initial?.prioridade ?? "normal",
    data_inicio: initial?.data_inicio ?? hoje(),
    tecnico: initial?.tecnico ?? "",
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || saving) return;
    onSubmit({
      ...form,
      descricao: form.descricao.trim(),
      solucao: form.solucao.trim(),
      tecnico: form.tecnico.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {children}

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Prioridade</label>
          <div className="flex gap-2 h-[38px]">
            {(["baixa", "normal", "alta"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setForm({ ...form, prioridade: p })}
                className={`flex-1 rounded-lg border text-[11px] font-bold transition-all ${
                  form.prioridade === p
                    ? p === "alta"
                      ? "bg-destructive/20 border-destructive text-destructive"
                      : p === "normal"
                        ? "bg-warning/20 border-warning text-warning"
                        : "bg-surface-2 border-border text-foreground"
                    : "border-border text-muted-foreground/40 hover:border-brand/30"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Data de Início</label>
          <input
            type="date"
            value={form.data_inicio}
            onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
            className="input-base w-full"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Técnico</label>
          <input
            type="text"
            value={form.tecnico}
            onChange={(e) => setForm({ ...form, tecnico: e.target.value })}
            placeholder="Nome do técnico responsável"
            className="input-base w-full"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Descrição do Problema
          </label>
          <textarea
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            rows={4}
            placeholder="O que o cliente relatou / diagnóstico..."
            className="input-base w-full resize-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Descrição da Solução <span className="font-normal text-muted-foreground/60">— o que foi feito</span>
          </label>
          <textarea
            value={form.solucao}
            onChange={(e) => setForm({ ...form, solucao: e.target.value })}
            rows={4}
            placeholder="Preencher durante ou após o serviço..."
            className="input-base w-full resize-none"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 border border-border rounded-lg text-sm text-foreground hover:bg-surface-2 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || !canSubmit}
          className="flex-1 py-2.5 bg-brand text-brand-foreground rounded-lg text-sm font-semibold hover:bg-brand/90 disabled:opacity-40 transition-colors"
        >
          {saving ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
