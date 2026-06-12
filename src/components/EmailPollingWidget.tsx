import { useEffect, useState } from "react";
import { startEmailPolling, stopEmailPolling, triggerEmailPolling, isEmailPollingActive } from "@/lib/api/emailPolling";

export function EmailPollingWidget() {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [debugLoading, setDebugLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugResult, setDebugResult] = useState<string>("");
  const [lastResult, setLastResult] = useState<{
    processed: number;
    total: number;
    message: string;
    authorized?: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Inicia polling automático ao montar
  useEffect(() => {
    console.log("[EmailPollingWidget] Starting auto-polling");

    startEmailPolling({
      intervalMs: 5 * 60 * 1000, // 5 minutos
      maxEmailsPerPoll: 5,
    });

    setIsRunning(true);

    // Para polling ao desmontar
    return () => {
      console.log("[EmailPollingWidget] Stopping auto-polling");
      stopEmailPolling();
      setIsRunning(false);
    };
  }, []);

  // Botão manual: força um check agora
  const handleManualCheck = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await triggerEmailPolling(5);
      if (!result) {
        throw new Error("Sem resposta do servidor");
      }
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

  // Deletar token
  const handleDeleteToken = async () => {
    if (!confirm("Tem certeza que quer deletar o token? Você precisará autorizar novamente.")) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/delete-gmail-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Erro ao deletar token");
      }

      setLastResult(null);
      alert("✅ Token deletado! Você pode autorizar uma nova conta.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar token");
      console.error("[EmailPollingWidget] Error deleting token:", err);
    } finally {
      setDeleting(false);
    }
  };

  // Debug endpoints
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
    <div className="w-full max-w-md mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">E-mails</h3>
        <div className="flex items-center gap-2">
          {isRunning && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-brand rounded-full animate-pulse" />
              <span className="text-xs text-brand font-medium">Automático</span>
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      {lastResult && (
        <div className="mb-4 p-3 bg-surface-2 border border-border rounded-lg">
          <p className="text-sm text-foreground">
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
              className="mt-3 inline-flex h-9 items-center justify-center rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground hover:bg-brand/90"
            >
              Autorizar Gmail
            </a>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleManualCheck}
          disabled={loading || deleting}
          className={`w-full py-2 px-4 rounded-lg font-medium transition ${
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
          className={`w-full py-2 px-4 rounded-lg font-medium transition text-sm ${
            deleting || loading
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-destructive/10 text-destructive hover:bg-destructive/20 active:bg-destructive/30 border border-destructive/30"
          }`}
        >
          {deleting ? "Deletando..." : "Deletar Token"}
        </button>
      </div>

      {/* Info */}
      <p className="mt-3 text-xs text-gray-500 text-center">
        Verifica automaticamente a cada 5 minutos
      </p>

      {/* Debug Section */}
      <details className="mt-4 pt-4 border-t border-border">
        <summary className="cursor-pointer text-xs text-gray-500 font-medium hover:text-gray-700">
          🔧 Debug
        </summary>
        <div className="mt-3 space-y-2">
          <button
            onClick={() => handleDebug("debug-gmail-token")}
            disabled={debugLoading}
            className="w-full py-1 px-3 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
          >
            {debugLoading ? "..." : "Token"}
          </button>
          <button
            onClick={() => handleDebug("debug-fetch-emails")}
            disabled={debugLoading}
            className="w-full py-1 px-3 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
          >
            {debugLoading ? "..." : "Buscar Emails"}
          </button>
          <button
            onClick={() => handleDebug("debug-process-email")}
            disabled={debugLoading}
            className="w-full py-1 px-3 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
          >
            {debugLoading ? "..." : "Processar Email"}
          </button>
          <button
            onClick={() => handleDebug("debug-process-pipeline")}
            disabled={debugLoading}
            className="w-full py-1 px-3 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
          >
            {debugLoading ? "..." : "Pipeline"}
          </button>
          <button
            onClick={() => handleDebug("debug-interpret-email")}
            disabled={debugLoading}
            className="w-full py-1 px-3 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
          >
            {debugLoading ? "..." : "Interpretar"}
          </button>

          {debugResult && (
            <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded text-xs max-h-64 overflow-auto font-mono whitespace-pre-wrap break-words text-gray-700">
              {debugResult}
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
