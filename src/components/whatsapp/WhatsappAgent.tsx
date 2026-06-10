import { useState, useEffect, useCallback } from "react";
import {
  Wifi, WifiOff, QrCode, RefreshCw, Trash2, Copy, Check,
  MessageCircle, Settings, Bot, Send, Loader2, Info,
  ToggleLeft, ToggleRight, AlertCircle, Plus, ArrowLeft,
} from "lucide-react";
import {
  getWhatsappConfigs, getWhatsappConfig, saveWhatsappConfig, getWhatsappMessages,
  clearWhatsappMessages, deleteContactMessages, deleteWhatsappConfig, evolutionAction, WhatsappConfig, WhatsappMessage,
} from "@/lib/api/whatsappAgent.functions";
import { DataCard, SectionTitle, Btn } from "@/components/shared";

type Tab = "status" | "messages" | "config";
type ConnState = "connected" | "disconnected" | "connecting" | "unknown";

interface Agent extends WhatsappConfig {
  id: string;
}

const DEFAULT_AGENT: Partial<Agent> = {
  label: "",
  evolution_url: "",
  evolution_key: "",
  instance_name: "vargasti",
  claude_system_prompt: "",
  auto_reply: true,
  save_as_notes: false,
  webhook_token: crypto.randomUUID(),
};

function getWebhookUrl(token: string) {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/api/whatsapp-webhook?token=${token}`;
}

export function WhatsappAgent() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  async function loadAgents() {
    setLoading(true);
    try {
      const data = await getWhatsappConfigs();
      setAgents(data);
    } catch {
      console.error("Failed to load agents");
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-5 text-brand animate-spin" />
      </div>
    );
  }

  if (!selectedAgentId) {
    return <AgentsList agents={agents} onSelectAgent={setSelectedAgentId} onRefresh={loadAgents} />;
  }

  const agent = agents.find((a) => a.id === selectedAgentId);
  if (!agent) return null;

  return (
    <AgentDetail
      agent={agent}
      onBack={() => setSelectedAgentId(null)}
      onUpdate={(updated) => {
        setAgents((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      }}
      onDelete={() => {
        setAgents((prev) => prev.filter((a) => a.id !== agent.id));
        setSelectedAgentId(null);
      }}
      onRefresh={loadAgents}
    />
  );
}

function AgentsList({ agents, onSelectAgent, onRefresh }: { agents: Agent[]; onSelectAgent: (id: string) => void; onRefresh: () => void }) {
  const [creatingNew, setCreatingNew] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(agents[0]?.id ?? null);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em] mb-2">Agente WhatsApp</p>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Seus agentes</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            selected={activeId === agent.id}
            onActivate={() => setActiveId(agent.id)}
            onOpen={() => onSelectAgent(agent.id)}
            onRefresh={onRefresh}
          />
        ))}

        <button
          onClick={() => setCreatingNew(true)}
          className="group min-h-[280px] rounded-[1.125rem] border border-dashed border-border hover:border-select/60 bg-card/40 hover:bg-card/70 p-6 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer"
        >
          <div className="size-14 rounded-xl bg-surface-2 border border-border grid place-items-center group-hover:border-select/40 transition-colors">
            <Plus className="size-6 text-muted-foreground group-hover:text-select transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-foreground">Criar novo agente</p>
            <p className="text-xs text-muted-foreground mt-1">VargasTI, Interative, ou customize</p>
          </div>
        </button>
      </div>

      {creatingNew && (
        <CreateAgentDialog onClose={() => setCreatingNew(false)} onCreated={() => { setCreatingNew(false); onRefresh(); }} />
      )}
    </div>
  );
}

function AgentCard({ agent, selected, onActivate, onOpen, onRefresh }: { agent: Agent; selected: boolean; onActivate: () => void; onOpen: () => void; onRefresh: () => void }) {
  const [connState, setConnState] = useState<ConnState>("unknown");
  const [msgCount, setMsgCount] = useState(0);

  useEffect(() => {
    checkConnection();
    loadMessageCount();
  }, [agent.id]);

  async function checkConnection() {
    try {
      const result = await evolutionAction({ data: { evolution_url: agent.evolution_url, evolution_key: agent.evolution_key, instance_name: agent.instance_name, action: "check_status" } });
      const state = (result as { state?: string })?.state ?? "disconnected";
      setConnState(state === "open" ? "connected" : "disconnected");
    } catch {
      setConnState("disconnected");
    }
  }

  async function loadMessageCount() {
    try {
      const msgs = await getWhatsappMessages();
      setMsgCount(msgs.length);
    } catch {
      setMsgCount(0);
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm(`Deletar agente "${agent.label}"?`)) return;
    await deleteWhatsappConfig({ data: { configId: agent.id } });
    onRefresh();
  }

  const initials = agent.label?.substring(0, 1).toUpperCase() || "A";
  const isConnected = connState === "connected";
  const statusLabel = isConnected ? "Conectado" : connState === "disconnected" ? "Desconectado" : "Aguardando conexão";
  const statusDot = isConnected ? "bg-brand" : connState === "disconnected" ? "bg-muted-foreground/40" : "bg-warning";
  const statusText = isConnected ? "text-brand" : connState === "disconnected" ? "text-muted-foreground" : "text-warning";

  return (
    <div
      onClick={onActivate}
      className={`card-selectable hover:card-selectable-hover p-6 flex flex-col gap-5 min-h-[280px] ${selected ? "card-selected" : ""}`}
    >
      <div className="flex items-center gap-4">
        <div className="icon-box size-14 text-lg font-bold">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-semibold text-foreground truncate">{agent.label || "Sem nome"}</p>
          <p className="text-xs text-muted-foreground truncate">{agent.claude_system_prompt ? "Customizado" : "Corporativo"}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${statusDot}`} />
          <p className={`text-sm font-medium ${statusText}`}>{statusLabel}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Instância: <code className="text-foreground bg-surface-2 px-1.5 py-0.5 rounded text-[11px] font-mono">{agent.instance_name}</code>
        </p>
        <p className="text-xs text-muted-foreground">{msgCount} mensagens</p>
      </div>

      <div className="mt-auto pt-4 border-t border-border/60 flex gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-surface/60 text-foreground text-sm font-medium hover:bg-surface-2 hover:border-select/40 transition-colors"
        >
          Editar
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-surface/60 text-foreground text-sm font-medium hover:bg-surface-2 hover:border-select/40 transition-colors"
        >
          Abrir
        </button>
        <button
          onClick={handleDelete}
          className="px-3 py-2.5 rounded-lg border border-border bg-surface/60 text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5 transition-colors"
          title="Deletar agente"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

function AgentDetail({ agent, onBack, onUpdate, onDelete, onRefresh }: { agent: Agent; onBack: () => void; onUpdate: (a: Agent) => void; onDelete: () => void; onRefresh: () => void }) {
  const [tab, setTab] = useState<Tab>("status");
  const [config, setConfig] = useState(agent);
  const [connState, setConnState] = useState<ConnState>("unknown");
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [checkingConn, setCheckingConn] = useState(false);
  const [messages, setMessages] = useState<WhatsappMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (tab === "messages") loadMessages();
  }, [tab]);

  async function loadMessages() {
    setLoadingMsgs(true);
    try {
      const msgs = await getWhatsappMessages();
      setMessages(msgs);
    } catch {
      setMessages([]);
    }
    setLoadingMsgs(false);
  }

  const checkConnection = useCallback(async () => {
    if (!config.evolution_url || !config.evolution_key) return;
    setCheckingConn(true);
    setQrBase64(null);
    try {
      const result = await evolutionAction({ data: { evolution_url: config.evolution_url, evolution_key: config.evolution_key, instance_name: config.instance_name, action: "check_status" } });
      const state = (result as { state?: string })?.state ?? "disconnected";
      setConnState(state === "open" ? "connected" : "disconnected");
      if (state !== "open") {
        const qrResult = await evolutionAction({ data: { evolution_url: config.evolution_url, evolution_key: config.evolution_key, instance_name: config.instance_name, action: "get_qr" } });
        setQrBase64((qrResult as { qr?: string | null })?.qr ?? null);
      }
    } catch {
      setConnState("disconnected");
    }
    setCheckingConn(false);
  }, [config.evolution_url, config.evolution_key, config.instance_name]);

  async function handleCreateInstance() {
    if (!config.evolution_url || !config.evolution_key) return;
    setCheckingConn(true);
    setQrBase64(null);
    try {
      const createResult = await evolutionAction({ data: { evolution_url: config.evolution_url, evolution_key: config.evolution_key, instance_name: config.instance_name, action: "create_instance" } });
      const qrFromCreate = (createResult as { qr?: string | null } | null)?.qr ?? null;
      if (qrFromCreate) {
        setConnState("disconnected");
        setQrBase64(qrFromCreate);
        setCheckingConn(false);
        evolutionAction({
          data: { evolution_url: config.evolution_url, evolution_key: config.evolution_key, instance_name: config.instance_name, action: "set_webhook", webhook_url: getWebhookUrl(config.webhook_token) },
        }).catch(() => null);
        return;
      }
      await evolutionAction({
        data: { evolution_url: config.evolution_url, evolution_key: config.evolution_key, instance_name: config.instance_name, action: "set_webhook", webhook_url: getWebhookUrl(config.webhook_token) },
      }).catch(() => null);
    } catch {
      /* ignore */
    }
    setCheckingConn(false);
    setTimeout(() => checkConnection(), 1000);
  }

  async function handleUpdateWebhook() {
    if (!config.evolution_url || !config.evolution_key) return;
    setCheckingConn(true);
    try {
      await evolutionAction({
        data: { evolution_url: config.evolution_url, evolution_key: config.evolution_key, instance_name: config.instance_name, action: "set_webhook", webhook_url: getWebhookUrl(config.webhook_token) },
      });
    } catch {
      /* ignore */
    }
    setCheckingConn(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveWhatsappConfig({ data: { ...config, id: config.id } as any });
      setSaveOk(true);
      onUpdate(config);
      setTimeout(() => setSaveOk(false), 2500);
    } catch {
      /* ignore */
    }
    setSaving(false);
  }

  async function handleClear() {
    await clearWhatsappMessages();
    setMessages([]);
  }

  async function handleDeleteContact(number: string) {
    if (!window.confirm(`Deletar conversa?`)) return;
    await deleteContactMessages({ data: { fromNumber: number } });
    setMessages((prev) => prev.filter((m) => m.from_number !== number));
    setSelectedContact(null);
  }

  function copyWebhook() {
    navigator.clipboard.writeText(getWebhookUrl(config.webhook_token));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const webhookUrl = getWebhookUrl(config.webhook_token);
  const isConfigured = !!config.evolution_url && !!config.evolution_key;

  return (
    <div className="flex flex-col h-[calc(100vh-2.5rem)]">
      <div className="flex items-center gap-3 p-4 border-b border-border bg-surface shrink-0">
        <button onClick={onBack} className="p-1.5 hover:bg-surface-2 rounded-lg transition-colors">
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <p className="text-xs font-semibold text-foreground">{config.label}</p>
          <p className="text-[10px] text-muted-foreground">{config.instance_name}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {connState === "connected" && (
            <span className="flex items-center gap-1.5 text-[10px] text-brand">
              <span className="size-1.5 rounded-full bg-brand status-pulse" />
              Conectado
            </span>
          )}
          {connState === "disconnected" && (
            <span className="flex items-center gap-1.5 text-[10px] text-destructive">
              <span className="size-1.5 rounded-full bg-destructive" />
              Desconectado
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-0 px-2 border-b border-border bg-surface shrink-0">
        {(["status", "messages", "config"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "status" && <Wifi className="size-3.5" />}
            {t === "messages" && <MessageCircle className="size-3.5" />}
            {t === "config" && <Settings className="size-3.5" />}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "status" && (
          <div className="p-4 md:p-5 space-y-4 max-w-2xl">
            {!isConfigured && (
              <div className="flex items-start gap-3 px-4 py-3 bg-warning/10 border border-warning/20 rounded-xl">
                <AlertCircle className="size-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-warning">
                  Configure a URL e chave da Evolution API na aba <strong>Configurações</strong> antes de continuar.
                </p>
              </div>
            )}

            <DataCard title="Conexão WhatsApp">
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-foreground">Instância: <code className="text-brand bg-brand/10 px-1.5 py-0.5 rounded text-[10px]">{config.instance_name}</code></p>
                    <p className="text-[10px] text-muted-foreground">{config.evolution_url || "URL não configurada"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Btn variant="secondary" size="sm" onClick={handleUpdateWebhook} disabled={!isConfigured || checkingConn} title="Atualiza o webhook">
                      <RefreshCw className="size-3" />
                      Webhook
                    </Btn>
                    <Btn variant="secondary" size="sm" onClick={checkConnection} disabled={!isConfigured || checkingConn}>
                      {checkingConn ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
                      Verificar
                    </Btn>
                    {connState === "disconnected" && (
                      <Btn size="sm" onClick={handleCreateInstance} disabled={checkingConn}>
                        <QrCode className="size-3" />
                        Criar instância
                      </Btn>
                    )}
                  </div>
                </div>

                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                  connState === "connected" ? "bg-brand/5 border-brand/20" : connState === "disconnected" ? "bg-destructive/5 border-destructive/20" : "bg-surface-2 border-border"
                }`}>
                  {connState === "connected" && <Wifi className="size-4 text-brand" />}
                  {connState === "disconnected" && <WifiOff className="size-4 text-destructive" />}
                  {connState === "unknown" && <Info className="size-4 text-muted-foreground" />}
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {connState === "connected" && "WhatsApp conectado"}
                      {connState === "disconnected" && "WhatsApp desconectado"}
                      {connState === "unknown" && "Estado desconhecido"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {connState === "disconnected" ? "Escaneie o QR Code abaixo" : "Clique em Verificar para atualizar"}
                    </p>
                  </div>
                </div>

                {qrBase64 && (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Escaneie com o WhatsApp</p>
                    <div className="p-3 bg-white rounded-2xl shadow-lg">
                      <img src={qrBase64} alt="QR Code" className="size-52" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Abra WhatsApp → Aparelhos conectados → Conectar</p>
                  </div>
                )}
              </div>
            </DataCard>

            <DataCard title="URL do Webhook">
              <div className="p-4 space-y-2">
                <p className="text-[10px] text-muted-foreground">Configure este endereço no Evolution API:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-[10px] text-brand font-mono truncate">
                    {webhookUrl}
                  </code>
                  <button
                    onClick={copyWebhook}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors text-[10px]"
                  >
                    {copied ? <Check className="size-3 text-brand" /> : <Copy className="size-3" />}
                    {copied ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>
            </DataCard>
          </div>
        )}

        {tab === "messages" && (
          <div className="flex h-full gap-0">
            <div className="w-56 border-r border-border flex flex-col shrink-0">
              <div className="p-3 border-b border-border space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase">Contatos</p>
                  <Btn variant="ghost" size="sm" onClick={loadMessages} disabled={loadingMsgs}>
                    <RefreshCw className={`size-3 ${loadingMsgs ? "animate-spin" : ""}`} />
                  </Btn>
                </div>
              </div>

              {loadingMsgs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-4 text-brand animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2 px-3">
                  <MessageCircle className="size-4 text-muted-foreground/40" />
                  <p className="text-[9px] text-muted-foreground">Sem conversas</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {Array.from(
                    messages.reduce((acc, msg) => {
                      const key = msg.from_number;
                      if (!acc.has(key)) {
                        acc.set(key, { name: msg.from_name, number: msg.from_number, lastMsg: msg.created_at });
                      }
                      return acc;
                    }, new Map<string, { name: string; number: string; lastMsg: string }>())
                  )
                    .sort((a, b) => new Date(b[1].lastMsg).getTime() - new Date(a[1].lastMsg).getTime())
                    .map(([number, contact]) => (
                      <div
                        key={number}
                        className={`relative group px-3 py-2 border-b border-border/50 hover:bg-white/[0.02] transition-colors cursor-pointer ${
                          selectedContact === number ? "bg-brand/10 border-l-2 border-l-brand" : ""
                        }`}
                        onClick={() => setSelectedContact(number)}
                      >
                        <p className="text-[10px] font-medium text-foreground truncate">{contact.name}</p>
                        <p className="text-[9px] text-muted-foreground/60 truncate">{number}</p>
                        <p className="text-[8px] text-muted-foreground/40 mt-0.5">
                          {new Date(contact.lastMsg).toLocaleString("pt-BR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteContact(number);
                          }}
                          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-destructive/20"
                        >
                          <Trash2 className="size-3 text-destructive" />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col">
              {selectedContact ? (
                <>
                  <div className="p-3 border-b border-border flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {messages.find((m) => m.from_number === selectedContact)?.from_name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{selectedContact}</p>
                    </div>
                    {selectedContact && (
                      <Btn variant="danger" size="sm" onClick={() => handleDeleteContact(selectedContact)}>
                        <Trash2 className="size-3" />
                      </Btn>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {messages
                      .filter((m) => m.from_number === selectedContact)
                      .map((msg) => (
                        <div key={msg.id} className={`flex ${msg.direction === "outgoing" ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[70%] rounded-2xl px-3 py-2 space-y-1 ${
                              msg.direction === "outgoing" ? "bg-brand/10 border border-brand/20" : "bg-surface border border-border"
                            }`}
                          >
                            <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                            <p className="text-[8px] text-muted-foreground/50 text-right">
                              {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <MessageCircle className="size-5 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">Selecione um contato</p>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "config" && (
          <div className="p-4 md:p-5 space-y-4 max-w-xl">
            <DataCard title="Informações do agente">
              <div className="p-4 space-y-3">
                <Field label="Nome do agente" placeholder="ex: VargasTI" value={config.label} onChange={(v) => setConfig({ ...config, label: v })} />
              </div>
            </DataCard>

            <DataCard title="Evolution API">
              <div className="p-4 space-y-3">
                <Field label="URL da API" placeholder="https://sua-evolution-api.com" value={config.evolution_url} onChange={(v) => setConfig({ ...config, evolution_url: v })} />
                <Field label="API Key" placeholder="sua-chave-secreta" type="password" value={config.evolution_key} onChange={(v) => setConfig({ ...config, evolution_key: v })} />
                <Field label="Nome da instância" placeholder="vargasti" value={config.instance_name} onChange={(v) => setConfig({ ...config, instance_name: v })} />
              </div>
            </DataCard>

            <DataCard title="Comportamento do agente">
              <div className="p-4 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Prompt do sistema (mensagens diretas)</label>
                  <textarea
                    value={config.claude_system_prompt}
                    onChange={(e) => setConfig({ ...config, claude_system_prompt: e.target.value })}
                    placeholder="Deixe vazio para usar o prompt padrão"
                    rows={4}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground resize-none focus:outline-none focus:border-brand/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Prompt do sistema (mensagens de grupos)</label>
                  <textarea
                    value={config.group_system_prompt || ""}
                    onChange={(e) => setConfig({ ...config, group_system_prompt: e.target.value })}
                    placeholder="Deixe vazio para usar o mesmo prompt das mensagens diretas"
                    rows={4}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground resize-none focus:outline-none focus:border-brand/40"
                  />
                </div>

                <Toggle
                  label="Responder automaticamente"
                  description="Claude responde cada mensagem"
                  value={config.auto_reply}
                  onChange={(v) => setConfig({ ...config, auto_reply: v })}
                />
                <Toggle
                  label="Responder em grupos"
                  description="Responder mensagens de grupos do WhatsApp"
                  value={config.reply_to_groups ?? false}
                  onChange={(v) => setConfig({ ...config, reply_to_groups: v })}
                />
                <Toggle
                  label="Salvar como anotações"
                  description="Conversas viram anotações"
                  value={config.save_as_notes}
                  onChange={(v) => setConfig({ ...config, save_as_notes: v })}
                />
              </div>
            </DataCard>

            <div className="flex items-center gap-2">
              <Btn onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                {saving ? "Salvando..." : "Salvar"}
              </Btn>
              {saveOk && <span className="text-[10px] text-brand flex items-center gap-1"><Check className="size-3" /> Salvo</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, placeholder, value, onChange, type = "text" }: { label: string; placeholder: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-muted-foreground uppercase tracking-widest">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand/40"
      />
    </div>
  );
}

function Toggle({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button onClick={() => onChange(!value)} className="shrink-0">
        {value ? <ToggleRight className="size-7 text-brand" /> : <ToggleLeft className="size-7 text-muted-foreground/40" />}
      </button>
    </div>
  );
}

function CreateAgentDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [config, setConfig] = useState<Partial<Agent>>(DEFAULT_AGENT);
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!config.label || !config.instance_name) {
      alert("Preencha nome e instância");
      return;
    }
    setSaving(true);
    try {
      const { id, ...rest } = config;
      await saveWhatsappConfig({ data: rest as any });
      onCreated();
    } catch (err) {
      console.error("Erro ao criar agente:", err);
      alert("Erro ao criar agente");
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-xl p-6 space-y-4 max-w-sm w-full mx-4">
        <h3 className="text-base font-semibold">Criar novo agente</h3>

        <Field label="Nome" placeholder="ex: VargasTI" value={config.label || ""} onChange={(v) => setConfig({ ...config, label: v })} />
        <Field label="Instância" placeholder="ex: vargasti" value={config.instance_name || ""} onChange={(v) => setConfig({ ...config, instance_name: v })} />

        <div className="flex gap-2 pt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-surface-2">
            Cancelar
          </button>
          <Btn onClick={handleCreate} disabled={saving || !config.label} className="flex-1">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            Criar
          </Btn>
        </div>
      </div>
    </div>
  );
}
