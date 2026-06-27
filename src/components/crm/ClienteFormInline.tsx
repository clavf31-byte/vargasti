import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClienteTagsInput } from "./ClienteTagsInput";
import { X } from "lucide-react";

interface ClienteFormInlineProps {
  userId: string;
  onSuccess: () => void;
  isOpen: boolean;
  onClose: () => void;
}

function fmtPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
}

function fmtCelular(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function ClienteFormInline({ userId, onSuccess, isOpen, onClose }: ClienteFormInlineProps) {
  const [formData, setFormData] = useState({
    nome: "", contato: "", email: "", telefone: "", celular: "",
    cnpj_cpf: "", endereco: "", cidade: "", estado: "", cep: "",
  });
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: insertError } = await supabase.from("clientes").insert([{ ...formData, user_id: userId }]);
      if (insertError) throw insertError;
      setFormData({ nome: "", contato: "", email: "", telefone: "", celular: "", cnpj_cpf: "", endereco: "", cidade: "", estado: "", cep: "" });
      setTags([]);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar cliente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-graphite p-6">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">Criar Novo Cliente</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="size-5" />
        </button>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Nome *</label>
          <input type="text" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} className="input-base w-full" required />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Contato</label>
          <input type="text" placeholder="Nome da pessoa de contato" value={formData.contato} onChange={(e) => setFormData({ ...formData, contato: e.target.value })} className="input-base w-full" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email</label>
          <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })} className="input-base w-full" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Telefone</label>
            <input type="text" placeholder="(XX) XXXX-XXXX" value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: fmtPhone(e.target.value) })} className="input-base w-full" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Celular</label>
            <input type="text" placeholder="(XX) XXXXX-XXXX" value={formData.celular} onChange={(e) => setFormData({ ...formData, celular: fmtCelular(e.target.value) })} className="input-base w-full" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">CPF/CNPJ</label>
          <input type="text" value={formData.cnpj_cpf} onChange={(e) => setFormData({ ...formData, cnpj_cpf: e.target.value })} className="input-base w-full" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Endereço</label>
          <input type="text" value={formData.endereco} onChange={(e) => setFormData({ ...formData, endereco: e.target.value })} className="input-base w-full" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Cidade</label>
            <input type="text" value={formData.cidade} onChange={(e) => setFormData({ ...formData, cidade: e.target.value })} className="input-base w-full" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Estado</label>
            <input type="text" value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} className="input-base w-full" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">CEP</label>
          <input type="text" value={formData.cep} onChange={(e) => setFormData({ ...formData, cep: e.target.value })} className="input-base w-full" />
        </div>

        <ClienteTagsInput tags={tags} onChange={setTags} />

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border rounded-lg text-sm text-foreground hover:bg-surface-2 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={loading || !formData.nome} className="flex-1 py-2.5 bg-brand text-brand-foreground rounded-lg text-sm font-semibold hover:bg-brand/90 disabled:opacity-50 transition-colors">
            {loading ? "Criando..." : "Criar Cliente"}
          </button>
        </div>
      </form>
    </div>
  );
}
