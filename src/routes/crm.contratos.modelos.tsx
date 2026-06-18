import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader, Card, Button } from "@/components/ui";
import { colors, spacing, borderRadius } from "@/lib/colors";
import { Plus, Edit2, Trash2, ClipboardList, Download } from "lucide-react";

const MODELO_SUPORTE_TI = {
  nome: "Contrato de Suporte e Infraestrutura de TI",
  descricao: "Contrato mensal com suporte técnico, comodato de equipamentos e antivírus Acronis",
  conteudo: `PROPOSTA COMERCIAL E TÉCNICA
Contrato Mensal de Suporte e Infraestrutura de TI

Cliente: {{cliente_nome}}
Data: {{data}}
Status: Aguardando / Proposta Comercial

1. INTRODUÇÃO E OBJETIVO

Esta proposta visa estabelecer uma parceria estratégica com a {{cliente_nome}}, garantindo a estabilidade, segurança e conformidade de sua infraestrutura de Tecnologia da Informação (TI). Nosso foco inicial será a reestruturação física e lógica do ambiente de rede, seguida por um modelo de suporte técnico proativo e contínuo para os usuários e dispositivos da empresa.

2. ESCOPO DO SUPORTE TÉCNICO MENSAL

Garantimos a sustentação e continuidade das operações de TI da {{cliente_nome}} através de um modelo de atendimento ilimitado focado na produtividade da sua equipe:

• Suporte Técnico Ilimitado: Atendimento técnico remoto e presencial (quando necessário) para resolução de problemas em hardware, software, sistemas operacionais (Windows 10 e Windows 11) e conectividade à rede.
• Comunicação Ágil via WhatsApp: Criação de um grupo exclusivo de comunicação direta com a nossa equipe de suporte para a abertura célere de chamados, dúvidas rápidas e alertas de urgência.
• Portal do Cliente dedicado: Acesso exclusivo a uma plataforma web para abertura, acompanhamento em tempo real, consulta de histórico de chamados e extração de relatórios de desempenho e cumprimento de SLA.
• Parque Tecnológico Coberto: Suporte integral e mapeamento para as {{estacoes_trabalho}} estações de trabalho (computadores) atualmente ativas no cliente.

3. PROJETO DE ADEQUAÇÃO DE INFRAESTRUTURA (SETUP INICIAL)

Antes do início da fase de suporte preventivo regular, realizaremos uma intervenção técnica obrigatória para corrigir as falhas físicas e lógicas da atual infraestrutura do cliente:

• Auditoria e Identificação: Mapeamento completo da rede atual, com testes de conectividade e etiquetagem padronizada de todos os pontos de rede e cabos de manobra (patch cords).
• Organização Física do Rack (Wire Management): Acomodação dos equipamentos ativos, fixação de guias de cabos, eliminação de cabos excedentes ou soltos e substituição de cabos danificados para otimizar o fluxo de ar e espaço.
• Limpeza e Ventilação: Limpeza interna preventiva do rack para eliminação de poeira e resíduos, mitigando riscos de superaquecimento e aumentando a vida útil dos equipamentos.

4. DETALHAMENTO TÉCNICO DOS EQUIPAMENTOS EM COMODATO

Para elevar a segurança e a performance da rede sem necessidade de investimento imediato em hardware (CapEx), serão cedidos em regime de comodato, durante a vigência do contrato, os seguintes ativos de nível corporativo:

A. Firewall Load Balance (Gerenciamento de Rede e Links)
Equipamento centralizador da segurança perimetral e controle do tráfego de internet. Permite realizar o Failover e Load Balancing, distribuindo o tráfego inteligentemente entre múltiplos links de internet. Caso o link principal sofra uma queda, o link secundário assume a operação de forma automática e transparente para os usuários.

B. Switch Gigabit 10/100/1000 Mbps
Switch corporativo focado na interconexão de alta velocidade para todos os computadores, impressoras e servidores locais. Garante um throughput Gigabit estável, eliminando perdas de pacotes e lentidão na transferência de arquivos internos.

C. Antena Wi-Fi Corporativa (Access Point) e Segmentação de Redes
Substituição de roteadores domésticos instáveis por um ponto de acesso profissional de alta densidade, com duas redes segregadas via VLAN:
- Rede Corporativa: Acesso completo para colaboradores internos (WPA2/WPA3 Enterprise).
- Rede de Visitantes: Acesso restrito à internet, isolada da rede interna.

5. SEGURANÇA DE ENDPOINT E PROTEÇÃO DE DADOS

Inclusão de proteção avançada contra ameaças cibernéticas modernas diretamente nas estações de trabalho através do ecossistema Acronis:

• Licenciamento Integrado: Disponibilização de {{licencas_acronis}} licenças ativas do antivírus Acronis Cyber Protect durante toda a vigência do contrato.
• Gestão Centralizada em Nuvem: A contratada assume toda a responsabilidade de monitoramento de alertas, agendamento de varreduras periódicas, isolamento de ameaças e aplicação de patches.
• Proteção Comportamental Proativa: Uso de Inteligência Artificial para identificar comportamentos anômalos e bloquear processos maliciosos antes do sequestro ou criptografia de arquivos locais.

6. RESPONSABILIDADES RESUMIDAS DA CONTRATADA

• Monitoramento ativo de performance, estabilidade e disponibilidade dos links de internet e da integridade do firewall.
• Execução de manutenções preventivas lógicas e suporte corretivo nas estações de trabalho mapeadas.
• Atualização contínua das vacinas do antivírus Acronis e auditoria de patches de segurança críticos do Windows.
• Substituição e troca ágil (SLA de Hardware) dos equipamentos fornecidos em comodato em caso de falha técnica, vício ou defeito de fabricação.

7. CONDIÇÕES COMERCIAIS E INVESTIMENTO

| Item / Serviço                          | Tipo           | Valor         |
|----------------------------------------|----------------|---------------|
| Taxa de Setup Inicial                  | Taxa Única     | {{valor_setup}} |
| Mensalidade de Suporte em TI           | Recorrente     | {{valor_mensal}} |

Vigência do Contrato: {{vigencia_meses}} meses, renováveis automaticamente por iguais períodos.
Forma de Pagamento: Faturamento via boleto bancário/PIX com vencimento para o dia {{dia_vencimento}} de cada mês.

Estamos à inteira disposição para esclarecer quaisquer dúvidas técnicas ou comerciais.

_________________________________________________
{{cliente_nome}}
Data: ____ / ____ / ________`,
};

export const Route = createFileRoute("/crm/contratos/modelos")({
  head: () => ({ meta: [{ title: "Modelos de Contratos · CRM VargasTI" }] }),
  component: ModelosPage,
});

interface Template {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  created_at: string;
}

function ModelosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ nome: "", descricao: "", conteudo: "" });

  const loadTemplates = async () => {
    if (!user) return;
    try {
      const { data, error } = await (supabase as any)
        .from("contract_templates")
        .select("id, nome, descricao, ativo, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (e) {
      console.error("Erro:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [user]);

  const handleCreate = async () => {
    if (!user || !newTemplate.nome.trim()) return;
    try {
      const { error } = await (supabase as any).from("contract_templates").insert([
        {
          user_id: user.id,
          nome: newTemplate.nome,
          descricao: newTemplate.descricao,
          conteudo: newTemplate.conteudo,
          variaveis: [], // Parse variáveis do conteúdo depois
        },
      ]);
      if (error) throw error;
      setNewTemplate({ nome: "", descricao: "", conteudo: "" });
      setIsFormOpen(false);
      loadTemplates();
    } catch (e) {
      console.error("Erro ao criar:", e);
      alert("Erro ao criar modelo");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza?")) return;
    try {
      await (supabase as any).from("contract_templates").delete().eq("id", id);
      loadTemplates();
    } catch (e) {
      alert("Erro ao deletar");
    }
  };

  return (
    <AppShell>
      <div style={{ padding: spacing.xl, maxWidth: "1200px", margin: "0 auto" }}>
        <PageHeader
          title="Modelos de Contrato"
          subtitle={`${templates.length} modelo(s) criado(s)`}
          action={
            <Button
              variant="primary"
              onClick={() => setIsFormOpen(!isFormOpen)}
            >
              {isFormOpen ? "Cancelar" : <><Plus size={18} /> Novo Modelo</>}
            </Button>
          }
          icon={<ClipboardList size={32} color={colors.primary} />}
        />

        {!isFormOpen && (
          <Card style={{ marginBottom: spacing.xl, padding: spacing.lg, display: "flex", alignItems: "center", justifyContent: "space-between", gap: spacing.lg }}>
            <div>
              <div style={{ fontWeight: 600, color: colors.text, marginBottom: "4px" }}>
                {MODELO_SUPORTE_TI.nome}
              </div>
              <div style={{ fontSize: "13px", color: colors.textSecondary }}>
                {MODELO_SUPORTE_TI.descricao}
              </div>
              <div style={{ fontSize: "12px", color: colors.textSecondary, marginTop: "6px" }}>
                Variáveis: <code style={{ background: colors.background, padding: "1px 4px", borderRadius: "3px" }}>
                  {"{{cliente_nome}}, {{data}}, {{estacoes_trabalho}}, {{licencas_acronis}}, {{valor_setup}}, {{valor_mensal}}, {{vigencia_meses}}, {{dia_vencimento}}"}
                </code>
              </div>
            </div>
            <button
              onClick={() => {
                setNewTemplate({ nome: MODELO_SUPORTE_TI.nome, descricao: MODELO_SUPORTE_TI.descricao, conteudo: MODELO_SUPORTE_TI.conteudo });
                setIsFormOpen(true);
              }}
              style={{
                display: "flex", alignItems: "center", gap: spacing.sm,
                background: colors.primary, color: "#fff", border: "none",
                padding: `${spacing.sm} ${spacing.lg}`, borderRadius: borderRadius.md,
                cursor: "pointer", fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap",
              }}
            >
              <Download size={14} /> Usar este Modelo
            </button>
          </Card>
        )}

        {isFormOpen && (
          <Card style={{ marginBottom: spacing.xl }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.lg, marginBottom: spacing.lg }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", marginBottom: spacing.sm, fontWeight: 600 }}>
                  Nome do Modelo *
                </label>
                <input
                  type="text"
                  placeholder="ex: Contrato de Suporte TI"
                  value={newTemplate.nome}
                  onChange={(e) => setNewTemplate({ ...newTemplate, nome: e.target.value })}
                  style={{
                    width: "100%",
                    padding: spacing.md,
                    border: `1px solid ${colors.border}`,
                    borderRadius: borderRadius.md,
                    fontSize: "14px",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", marginBottom: spacing.sm, fontWeight: 600 }}>
                  Descrição
                </label>
                <input
                  type="text"
                  placeholder="Descreva o contrato"
                  value={newTemplate.descricao}
                  onChange={(e) => setNewTemplate({ ...newTemplate, descricao: e.target.value })}
                  style={{
                    width: "100%",
                    padding: spacing.md,
                    border: `1px solid ${colors.border}`,
                    borderRadius: borderRadius.md,
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", marginBottom: spacing.sm, fontWeight: 600 }}>
                Conteúdo do Contrato *
              </label>
              <p style={{ fontSize: "12px", color: colors.textSecondary, marginBottom: spacing.sm }}>
                Use variáveis como: {"{{cliente_nome}}"}, {"{{data}}"}, {"{{valor}}"}, etc.
              </p>
              <textarea
                placeholder="Cole aqui o conteúdo do seu contrato..."
                value={newTemplate.conteudo}
                onChange={(e) => setNewTemplate({ ...newTemplate, conteudo: e.target.value })}
                style={{
                  width: "100%",
                  minHeight: "200px",
                  padding: spacing.md,
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.md,
                  fontSize: "14px",
                  fontFamily: "monospace",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: spacing.md, marginTop: spacing.lg }}>
              <Button variant="primary" onClick={handleCreate}>
                Criar Modelo
              </Button>
              <Button variant="secondary" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
            </div>
          </Card>
        )}

        {loading ? (
          <p style={{ color: colors.textSecondary }}>Carregando...</p>
        ) : templates.length === 0 ? (
          <Card>
            <p style={{ color: colors.textSecondary, margin: 0, textAlign: "center" }}>
              Nenhum modelo criado ainda
            </p>
          </Card>
        ) : (
          <Card>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                    <th style={{ padding: spacing.md, textAlign: "left", color: colors.textSecondary, fontWeight: 600 }}>
                      Nome
                    </th>
                    <th style={{ padding: spacing.md, textAlign: "left", color: colors.textSecondary, fontWeight: 600 }}>
                      Descrição
                    </th>
                    <th style={{ padding: spacing.md, textAlign: "center", color: colors.textSecondary, fontWeight: 600 }}>
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t) => (
                    <tr key={t.id} style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
                      <td style={{ padding: spacing.md, color: colors.text, fontWeight: 500 }}>{t.nome}</td>
                      <td style={{ padding: spacing.md, color: colors.textSecondary }}>{t.descricao || "-"}</td>
                      <td style={{ padding: spacing.md, textAlign: "center", display: "flex", gap: spacing.sm, justifyContent: "center" }}>
                        <button
                          onClick={() => navigate({ to: `/crm/contratos/modelos/${t.id}` })}
                          style={{
                            background: colors.background,
                            border: `1px solid ${colors.border}`,
                            color: colors.primary,
                            padding: `${spacing.sm} ${spacing.md}`,
                            borderRadius: borderRadius.sm,
                            cursor: "pointer",
                            fontSize: "12px",
                            display: "flex",
                            gap: "4px",
                            alignItems: "center",
                          }}
                          title="Clique para editar o modelo"
                        >
                          <Edit2 size={14} /> Editar
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          style={{
                            background: colors.background,
                            border: `1px solid ${colors.error}`,
                            color: colors.error,
                            padding: `${spacing.sm} ${spacing.md}`,
                            borderRadius: borderRadius.sm,
                            cursor: "pointer",
                            fontSize: "12px",
                            display: "flex",
                            gap: "4px",
                            alignItems: "center",
                          }}
                        >
                          <Trash2 size={14} /> Deletar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
