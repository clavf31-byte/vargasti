import { useEffect, useState } from "react";
import { startEmailPolling, stopEmailPolling, triggerEmailPolling, isEmailPollingActive } from "@/lib/api/emailPolling";

export function EmailPollingWidget() {
  const [loading, setLoading] = useState(false);
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

      {/* Button */}
      <button
        onClick={handleManualCheck}
        disabled={loading}
        className={`w-full py-2 px-4 rounded-lg font-medium transition ${
          loading
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-brand text-brand-foreground hover:bg-brand/90 active:bg-brand/80"
        }`}
      >
        {loading ? "Verificando..." : "Verificar Agora"}
      </button>

      {/* Info */}
      <p className="mt-3 text-xs text-gray-500 text-center">
        Verifica automaticamente a cada 5 minutos
      </p>
    </div>
  );
}
