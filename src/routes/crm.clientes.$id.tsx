import client from "@/config/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/shared";
import { ChevronLeft, User } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/crm/clientes/$id")({
  head: () => ({ meta: [{ title: `Editar Cliente · CRM ${client.name}` }] }),
  component: EditarClientePage,
});

type Cliente = {
  id: string;
  nome: string;
  contato?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  cnpj_cpf?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
};

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

function EditarClientePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = Route.useParams();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: "", contato: "", email: "", telefone: "", celular: "",
    cnpj_cpf: "", endereco: "", cidade: "", estado: "", cep: "",
  });

  useEffect(() => { if (!user || !id) return; loadCliente(); }, [user, id]);

  async function loadCliente() {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from("clientes").select("*").eq("id", id).eq("user_id", user!.id).single();
      if (err) throw err;
      setCliente(data as Cliente);
      setFormData({
        nome: data.nome || "", contato: data.contato || "", email: data.email || "",
        telefone: data.telefone || "", celular: data.celular || "", cnpj_cpf: data.cnpj_cpf || "",
        endereco: data.endereco || "", cidade: data.cidade || "", estado: data.estado || "", cep: data.cep || "",
      });
    } catch (err) {
      setError("Erro ao carregar cliente");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const { error: err } = await supabase.from("clientes").update(formData).eq("id", id).eq("user_id", user!.id);
      if (err) throw err;
      setMessage("Cliente atualizado com sucesso!");
      setTimeout(() => navigate({ to: "/crm/clientes" }), 1500);
    } catch (err) {
      setError("Erro ao salvar cliente");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <AppShell><div className="p-6 text-sm text-muted-foreground">Carregando...</div></AppShell>;
  }

  if (!cliente) {
    return <AppShell><div className="p-6 text-sm text-destructive">Cliente não encontrado</div></AppShell>;
  }

  return (
    <AppShell>
      <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">
        <button
          onClick={() => navigate({ to: "/crm/clientes" })}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-select hover:text-select/80 transition-colors"
        >
          <ChevronLeft className="size-4" /> Voltar
        </button>

        <PageHeader category="CRM" title="Editar Cliente" icon={User} subtitle={cliente.nome} />

        <div className="card-graphite p-6">
          {error && <div className="mb-4 px-3 py-2 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg">{error}</div>}
          {message && <div className="mb-4 px-3 py-2 text-sm text-brand bg-brand/10 border border-brand/30 rounded-lg">{message}</div>}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Nome *</label>
              <input type="text" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} required className="input-base w-full" />
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

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => navigate({ to: "/crm/clientes" })} className="flex-1 py-2.5 border border-border rounded-lg text-sm text-foreground hover:bg-surface-2 transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-brand text-brand-foreground rounded-lg text-sm font-semibold hover:bg-brand/90 disabled:opacity-50 transition-colors">
                {saving ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
