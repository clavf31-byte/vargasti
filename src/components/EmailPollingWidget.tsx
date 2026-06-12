import { useEffect, useState } from "react";
import { startEmailPolling, stopEmailPolling, triggerEmailPolling } from "@/lib/api/emailPolling";
import { useEmailConfig } from "@/hooks/useEmailConfig";
import {
  ConfigCategoriesModal,
  ConfigWhitelistModal,
  ConfigPrioritiesModal,
} from "./EmailConfigModals";

export function EmailPollingWidget() {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [debugLoading, setDebugLoading] = useState(false);
  const [debugResult, setDebugResult] = useState<string>("");
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showWhitelistModal, setShowWhitelistModal] = useState(false);
  const [showPrioritiesModal, setShowPrioritiesModal] = useState(false);
  const [lastResult, setLastResult] = useState<{
    processed: number;
    total: number;
    message: string;
    authorized?: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const { categories, whitelist, priorities, loaded, saveCategories, saveWhitelist, savePriorities } =
    useEmailConfig();

  useEffect(() => {
    console.log("[EmailPollingWidget] Starting auto-polling");
    startEmailPolling({
      intervalMs: 5 * 60 * 1000,
      maxEmailsPerPoll: 5,
    });
    setIsRunning(true);
    return () => {
      console.log("[EmailPollingWidget] Stopping auto-polling");
      stopEmailPolling();
      setIsRunning(false);
    };
  }, []);

  const handleManualCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await triggerEmailPolling(5);
      if (!result) throw new Error("Sem resposta do servidor");
      setLastResult({
        processed: result.processed ?? 0,
        total: result.total ?? 0,
        message: result.message ?? "",
        authorized: result.authorized,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao verificar e-mails");
      console.error("[EmailPollingWidget] Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteToken = async () => {
    if (!confirm("Tem certeza que quer deletar o token? Você precisará autorizar novamente.")) return;
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch("/api/delete-gmail-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Erro ao deletar token");
      setLastResult(null);
      alert("✅ Token deletado! Você pode autorizar uma nova conta.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar token");
    } finally {
      setDeleting(false);
    }
  };

  const handleDebug = async (endpoint: string) => {
    setDebugLoading(true);
    try {
      const response = await fetch(`/api/${endpoint}`);
      const data = await response.json();
      setDebugResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setDebugResult(`Erro: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setDebugLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Header com Status */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Gerenciador de E-mails</h3>
        {isRunning && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-brand rounded-full animate-pulse" />
            <span className="text-xs text-brand font-medium">Automático</span>
          </div>
        )}
      </div>

      {/* Status Card */}
      {lastResult && (
        <div className="p-4 bg-surface-2 border border-border rounded-lg">
          <p className="text-sm text-foreground font-semibold mb-3">
            {lastResult.authorized === false ? (
              lastResult.message
            ) : (
              <>
                <strong>{lastResult.processed}</strong> de <strong>{lastResult.total}</strong> e-mail(ns) processado(s)
              </>
            )}
          </p>
          {lastResult.authorized === false && (
            <a
              href="/api/gmail-auth"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground hover:bg-brand/90"
            >
              Autorizar Gmail
            </a>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleManualCheck}
          disabled={loading || deleting}
          className={`py-2 px-4 rounded-lg font-medium transition ${
            loading || deleting
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-brand text-brand-foreground hover:bg-brand/90 active:bg-brand/80"
          }`}
        >
          {loading ? "Verificando..." : "Verificar Agora"}
        </button>

        <button
          onClick={handleDeleteToken}
          disabled={deleting || loading}
          className={`py-2 px-4 rounded-lg font-medium transition text-sm ${
            deleting || loading
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30"
          }`}
        >
          {deleting ? "Deletando..." : "Deletar Token"}
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-surface-2 border border-border rounded-lg">
          <h4 className="font-semibold text-sm mb-1">Automático</h4>
          <p className="text-xs text-gray-600">Verifica Gmail a cada 5 minutos e cria tickets automaticamente no Helpdesk.</p>
        </div>
        <div className="p-3 bg-surface-2 border border-border rounded-lg">
          <h4 className="font-semibold text-sm mb-1">Manual</h4>
          <p className="text-xs text-gray-600">Clique "Verificar Agora" para forçar uma sincronização imediata.</p>
        </div>
        <div className="p-3 bg-surface-2 border border-border rounded-lg">
          <h4 className="font-semibold text-sm mb-1">IA Inteligente</h4>
          <p className="text-xs text-gray-600">Claude analisa cada e-mail para categorizar e priorizar automaticamente.</p>
        </div>
        <div className="p-3 bg-surface-2 border border-border rounded-lg">
          <h4 className="font-semibold text-sm mb-1">Zero Config</h4>
          <p className="text-xs text-gray-600">Após inicial setup do Gmail OAuth, tudo funciona sem intervenção.</p>
        </div>
      </div>

      {/* Config Card */}
      <details className="p-4 bg-surface-2 border border-border rounded-lg">
        <summary className="cursor-pointer font-semibold text-sm hover:text-brand">
          ⚙️ Configurações
        </summary>
        <div className="mt-4 space-y-4">
          {/* Gerenciar Palavras-chave */}
          <div>
            <h4 className="font-semibold text-sm mb-2">📝 Gerenciar Palavras-chave</h4>
            <p className="text-xs text-gray-600 mb-2">
              {loaded ? `${categories.length} categorias configuradas` : "Carregando..."}
            </p>
            <button
              onClick={() => setShowCategoriesModal(true)}
              className="w-full py-2 px-3 text-sm bg-brand text-brand-foreground rounded hover:bg-brand/90"
            >
              Editar Palavras-chave
            </button>
          </div>

          {/* Clientes Permitidos */}
          <div>
            <h4 className="font-semibold text-sm mb-2">👥 Clientes Permitidos</h4>
            <p className="text-xs text-gray-600 mb-2">
              {loaded ? `${whitelist.length} clientes na whitelist` : "Carregando..."}
            </p>
            <button
              onClick={() => setShowWhitelistModal(true)}
              className="w-full py-2 px-3 text-sm bg-brand text-brand-foreground rounded hover:bg-brand/90"
            >
              Gerenciar Clientes
            </button>
          </div>

          {/* Prioridades */}
          <div>
            <h4 className="font-semibold text-sm mb-2">🎯 Regras de Prioridade</h4>
            <p className="text-xs text-gray-600 mb-2">
              {loaded ? `${priorities.length} regras de prioridade` : "Carregando..."}
            </p>
            <button
              onClick={() => setShowPrioritiesModal(true)}
              className="w-full py-2 px-3 text-sm bg-brand text-brand-foreground rounded hover:bg-brand/90"
            >
              Editar Prioridades
            </button>
          </div>
        </div>
      </details>

      {/* Debug Section */}
      <details className="p-4 bg-surface-2 border border-border rounded-lg">
        <summary className="cursor-pointer font-semibold text-sm hover:text-brand">
          🔧 Debug
        </summary>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => handleDebug("debug-gmail-token")}
            disabled={debugLoading}
            className="py-1 px-2 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
          >
            Token
          </button>
          <button
            onClick={() => handleDebug("debug-fetch-emails")}
            disabled={debugLoading}
            className="py-1 px-2 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
          >
            Buscar
          </button>
          <button
            onClick={() => handleDebug("debug-process-email")}
            disabled={debugLoading}
            className="py-1 px-2 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
          >
            Processar
          </button>
          <button
            onClick={() => handleDebug("debug-process-pipeline")}
            disabled={debugLoading}
            className="py-1 px-2 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
          >
            Pipeline
          </button>

          {debugResult && (
            <div className="col-span-2 mt-3 p-2 bg-gray-50 border border-gray-200 rounded text-xs max-h-48 overflow-auto font-mono whitespace-pre-wrap break-words text-gray-700">
              {debugResult}
            </div>
          )}
        </div>
      </details>

      {/* Info */}
      <p className="text-xs text-gray-500 text-center">
        Verifica automaticamente a cada 5 minutos
      </p>

      {/* Modals */}
      {showCategoriesModal && (
        <ConfigCategoriesModal
          categories={categories}
          onSave={saveCategories}
          onClose={() => setShowCategoriesModal(false)}
        />
      )}

      {showWhitelistModal && (
        <ConfigWhitelistModal
          whitelist={whitelist}
          onSave={saveWhitelist}
          onClose={() => setShowWhitelistModal(false)}
        />
      )}

      {showPrioritiesModal && (
        <ConfigPrioritiesModal
          priorities={priorities}
          onSave={savePriorities}
          onClose={() => setShowPrioritiesModal(false)}
        />
      )}
    </div>
  );
}
