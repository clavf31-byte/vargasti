import { useState, useEffect, useCallback } from "react";
import {
  Wifi, WifiOff, QrCode, RefreshCw, Trash2, Copy, Check,
  MessageCircle, Settings, Bot, Send, Loader2, Info,
  ToggleLeft, ToggleRight, AlertCircle,
} from "lucide-react";
import {
  getWhatsappConfig, saveWhatsappConfig, getWhatsappMessages,
  clearWhatsappMessages, WhatsappConfig, WhatsappMessage,
} from "@/lib/api/whatsappAgent.functions";
import { DataCard, SectionTitle, Btn } from "@/components/shared";

type Tab = "status" | "messages" | "config";
type ConnState = "connected" | "disconnected" | "connecting" | "unknown";

const DEFAULT_CONFIG: WhatsappConfig = {
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
  const [tab, setTab] = useState<Tab>("status");
  const [config, setConfig] = useState<WhatsappConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  const [connState, setConnState] = useState<ConnState>("unknown");
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [checkingConn, setCheckingConn] = useState(false);

  const [messages, setMessages] = useState<WhatsappMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load config
  useEffect(() => {
    getWhatsappConfig().then((cfg) => {
      if (cfg) setConfig(cfg);
      setConfigLoaded(true);
    }).catch(() => setConfigLoaded(true));
  }, []);

  // Load messages when tab changes
  useEffect(() => {
    if (tab === "messages") loadMessages();
  }, [tab]);

  async function loadMessages() {
    setLoadingMsgs(true);
    try {
      const msgs = await getWhatsappMessages();
      setMessages(msgs);
    } catch { /* ignore */ }
    setLoadingMsgs(false);
  }

  const checkConnection = useCallback(async () => {
    if (!config.evolution_url || !config.evolution_key || !config.instance_name) return;
    setCheckingConn(true);
    setQrBase64(null);

    try {
      const base = config.evolution_url.replace(/\/$/, "");
      const res = await fetch(
        `${base}/instance/connectionState/${config.instance_name}`,
        { headers: { apikey: config.evolution_key } }
      );
      if (!res.ok) { setConnState("disconnected"); setCheckingConn(false); return; }
      const json = await res.json() as { instance?: { state?: string } };
      const state = json?.instance?.state ?? "";
      if (state === "open") {
        setConnState("connected");
      } else {
        setConnState("disconnected");
        fetchQr(base);
      }
    } catch {
      setConnState("disconnected");
    }
    setCheckingConn(false);
  }, [config.evolution_url, config.evolution_key, config.instance_name]);

  async function fetchQr(base: string) {
    try {
      const res = await fetch(
        `${base}/instance/connect/${config.instance_name}`,
        { headers: { apikey: config.evolution_key } }
      );
      if (!res.ok) return;
      const json = await res.json() as { base64?: string; qrcode?: { base64?: string } };
      const b64 = json?.base64 ?? json?.qrcode?.base64 ?? null;
      setQrBase64(b64);
    } catch { /* ignore */ }
  }

  async function handleCreateInstance() {
    if (!config.evolution_url || !config.evolution_key) return;
    setCheckingConn(true);
    try {
      const base = config.evolution_url.replace(/\/$/, "");
      await fetch(`${base}/instance/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: config.evolution_key },
        body: JSON.stringify({
          instanceName: config.instance_name,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
        }),
      });
      setTimeout(() => checkConnection(), 1500);
    } catch { /* ignore */ }
    setCheckingConn(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveWhatsappConfig({ data: config });
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2500);
    } catch { /* ignore */ }
    setSaving(false);
  }

  async function handleClear() {
    await clearWhatsappMessages();
    setMessages([]);
  }

  function copyWebhook() {
    navigator.clipboard.writeText(getWebhookUrl(config.webhook_token));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const webhookUrl = getWebhookUrl(config.webhook_token);
  const isConfigured = !!config.evolution_url && !!config.evolution_key;

  const tabs: { id: Tab; label: string; icon: typeof Wifi }[] = [
    { id: "status", label: "Status", icon: Wifi },
    { id: "messages", label: `Conversas${messages.length ? ` (${messages.length})` : ""}`, icon: MessageCircle },
    { id: "config", label: "Configurações", icon: Settings },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-2.5rem)]">
      {/* Tab bar */}
      <div className="flex items-center gap-0 px-2 border-b border-border bg-surface shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.id
                ? "border-brand text-brand"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/[0.02]"
            }`}
          >
            <t.icon className="size-3.5" />
            {t.label}
          </button>
        ))}

        <div className="ml-auto pr-2 flex items-center gap-2">
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

      <div className="flex-1 overflow-y-auto">
        {/* ── STATUS ─────────────────────────────────────────────────────────── */}
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
                    <Btn
                      variant="secondary"
                      size="sm"
                      onClick={checkConnection}
                      disabled={!isConfigured || checkingConn}
                    >
                      {checkingConn
                        ? <Loader2 className="size-3 animate-spin" />
                        : <RefreshCw className="size-3" />}
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

                {/* Connection indicator */}
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                  connState === "connected"
                    ? "bg-brand/5 border-brand/20"
                    : connState === "disconnected"
                    ? "bg-destructive/5 border-destructive/20"
                    : "bg-surface-2 border-border"
                }`}>
                  {connState === "connected" && <Wifi className="size-4 text-brand" />}
                  {connState === "disconnected" && <WifiOff className="size-4 text-destructive" />}
                  {connState === "unknown" && <Info className="size-4 text-muted-foreground" />}
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {connState === "connected" && "WhatsApp conectado"}
                      {connState === "disconnected" && "WhatsApp desconectado"}
                      {connState === "connecting" && "Conectando..."}
                      {connState === "unknown" && "Estado desconhecido"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {connState === "disconnected" ? "Escaneie o QR Code abaixo" : "Clique em Verificar para atualizar"}
                    </p>
                  </div>
                </div>

                {/* QR Code */}
                {qrBase64 && (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Escaneie com o WhatsApp</p>
                    <div className="p-3 bg-white rounded-2xl shadow-lg">
                      <img src={qrBase64} alt="QR Code WhatsApp" className="size-52" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Abra WhatsApp → Aparelhos conectados → Conectar</p>
                  </div>
                )}
              </div>
            </DataCard>

            {/* Webhook URL */}
            <DataCard title="URL do Webhook">
              <div className="p-4 space-y-2">
                <p className="text-[10px] text-muted-foreground">
                  Configure este endereço no Evolution API para receber mensagens:
                </p>
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
                <p className="text-[10px] text-muted-foreground/60">
                  Evento: <code className="text-muted-foreground">messages.upsert</code>
                </p>
              </div>
            </DataCard>

            {/* SQL para criar tabelas */}
            <DataCard title="SQL — criar tabelas (Supabase)">
              <div className="p-4 space-y-2">
                <p className="text-[10px] text-muted-foreground">Execute no SQL Editor do Supabase:</p>
                <pre className="bg-background border border-border rounded-xl p-3 text-[9px] text-muted-foreground font-mono overflow-x-auto leading-relaxed whitespace-pre">{SQL_SETUP}</pre>
              </div>
            </DataCard>
          </div>
        )}

        {/* ── MESSAGES ───────────────────────────────────────────────────────── */}
        {tab === "messages" && (
          <div className="p-4 md:p-5 space-y-4 max-w-3xl">
            <div className="flex items-center justify-between">
              <SectionTitle icon={MessageCircle}>Conversas recentes</SectionTitle>
              <div className="flex gap-2">
                <Btn variant="ghost" size="sm" onClick={loadMessages} disabled={loadingMsgs}>
                  <RefreshCw className={`size-3 ${loadingMsgs ? "animate-spin" : ""}`} />
                  Atualizar
                </Btn>
                {messages.length > 0 && (
                  <Btn variant="danger" size="sm" onClick={handleClear}>
                    <Trash2 className="size-3" />
                    Limpar
                  </Btn>
                )}
              </div>
            </div>

            {loadingMsgs ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="size-5 text-brand animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="size-12 rounded-2xl bg-surface border border-border grid place-items-center">
                  <MessageCircle className="size-5 text-muted-foreground/40" />
                </div>
                <p className="text-xs text-muted-foreground">Nenhuma conversa ainda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === "outgoing" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 space-y-1 ${
                      msg.direction === "outgoing"
                        ? "bg-brand/10 border border-brand/20"
                        : "bg-surface border border-border"
                    }`}>
                      <div className="flex items-center gap-2">
                        {msg.direction === "incoming"
                          ? <MessageCircle className="size-3 text-muted-foreground" />
                          : <Bot className="size-3 text-brand" />
                        }
                        <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">
                          {msg.direction === "incoming" ? msg.from_name : "Agente IA"}
                        </span>
                        {msg.direction === "incoming" && (
                          <span className="text-[9px] text-muted-foreground/50">{msg.from_number}</span>
                        )}
                      </div>
                      <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      <p className="text-[9px] text-muted-foreground/50 text-right">
                        {new Date(msg.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CONFIG ─────────────────────────────────────────────────────────── */}
        {tab === "config" && configLoaded && (
          <div className="p-4 md:p-5 space-y-4 max-w-xl">
            <DataCard title="Evolution API">
              <div className="p-4 space-y-3">
                <Field
                  label="URL da API"
                  placeholder="https://sua-evolution-api.com"
                  value={config.evolution_url}
                  onChange={(v) => setConfig((c) => ({ ...c, evolution_url: v }))}
                />
                <Field
                  label="API Key"
                  placeholder="sua-chave-secreta"
                  type="password"
                  value={config.evolution_key}
                  onChange={(v) => setConfig((c) => ({ ...c, evolution_key: v }))}
                />
                <Field
                  label="Nome da instância"
                  placeholder="vargasti"
                  value={config.instance_name}
                  onChange={(v) => setConfig((c) => ({ ...c, instance_name: v }))}
                />
              </div>
            </DataCard>

            <DataCard title="Comportamento do Agente">
              <div className="p-4 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    Prompt do sistema (Claude)
                  </label>
                  <textarea
                    value={config.claude_system_prompt}
                    onChange={(e) => setConfig((c) => ({ ...c, claude_system_prompt: e.target.value }))}
                    placeholder={`Você é um assistente pessoal do VargasTI Lab. Responda de forma clara e direta em português brasileiro. Seja conciso — estamos no WhatsApp.`}
                    rows={5}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground resize-none focus:outline-none focus:border-brand/40 focus:ring-1 focus:ring-brand/20 placeholder:text-muted-foreground/50 transition-all"
                  />
                  <p className="text-[9px] text-muted-foreground/60">Deixe vazio para usar o prompt padrão.</p>
                </div>

                <Toggle
                  label="Responder automaticamente com IA"
                  description="Claude responde cada mensagem recebida"
                  value={config.auto_reply}
                  onChange={(v) => setConfig((c) => ({ ...c, auto_reply: v }))}
                />
                <Toggle
                  label="Salvar como anotações"
                  description="Cada conversa vira uma anotação no VargasTI Hub"
                  value={config.save_as_notes}
                  onChange={(v) => setConfig((c) => ({ ...c, save_as_notes: v }))}
                />
              </div>
            </DataCard>

            <DataCard title="Segurança">
              <div className="p-4 space-y-2">
                <p className="text-[10px] text-muted-foreground">Token do webhook (gerado automaticamente):</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-[10px] text-brand font-mono truncate">
                    {config.webhook_token}
                  </code>
                  <button
                    onClick={() => setConfig((c) => ({ ...c, webhook_token: crypto.randomUUID() }))}
                    title="Gerar novo token"
                    className="p-2 rounded-xl border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <RefreshCw className="size-3.5" />
                  </button>
                </div>
                <p className="text-[9px] text-muted-foreground/60">Regenerar o token invalida o webhook atual.</p>
              </div>
            </DataCard>

            <div className="flex items-center gap-2 pt-1">
              <Btn onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                {saving ? "Salvando..." : "Salvar configurações"}
              </Btn>
              {saveOk && (
                <span className="flex items-center gap-1 text-[10px] text-brand">
                  <Check className="size-3" /> Salvo
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Field({
  label, placeholder, value, onChange, type = "text",
}: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; type?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-muted-foreground uppercase tracking-widest">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand/40 focus:ring-1 focus:ring-brand/20 placeholder:text-muted-foreground transition-all"
      />
    </div>
  );
}

function Toggle({
  label, description, value, onChange,
}: {
  label: string; description: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button onClick={() => onChange(!value)} className="shrink-0">
        {value
          ? <ToggleRight className="size-7 text-brand" />
          : <ToggleLeft className="size-7 text-muted-foreground/40" />
        }
      </button>
    </div>
  );
}

// ── SQL setup ──────────────────────────────────────────────────────────────────
const SQL_SETUP = `CREATE TABLE IF NOT EXISTS whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  evolution_url TEXT NOT NULL DEFAULT '',
  evolution_key TEXT NOT NULL DEFAULT '',
  instance_name TEXT NOT NULL DEFAULT 'vargasti',
  claude_system_prompt TEXT DEFAULT '',
  auto_reply BOOLEAN DEFAULT true,
  save_as_notes BOOLEAN DEFAULT false,
  webhook_token TEXT DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_config" ON whatsapp_config
  USING (auth.uid() = user_id);
CREATE POLICY "webhook_read_config" ON whatsapp_config
  FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_name TEXT,
  from_number TEXT,
  from_name TEXT,
  message TEXT,
  response TEXT,
  direction TEXT DEFAULT 'incoming',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_messages" ON whatsapp_messages
  USING (auth.uid() = user_id);`;
