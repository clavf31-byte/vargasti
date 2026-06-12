import { useEffect, useState } from "react";
import { startEmailPolling, stopEmailPolling, triggerEmailPolling, isEmailPollingActive } from "@/lib/api/emailPolling";

export function EmailPollingWidget() {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{
    processed: number;
    total: number;
    message: string;
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
      setLastResult({
        processed: result.processed,
        total: result.total,
        message: result.message,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao verificar e-mails");
      console.error("[EmailPollingWidget] Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-white border border-gray-200 rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">E-mails</h3>
        <div className="flex items-center gap-2">
          {isRunning && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-600 font-medium">Automático</span>
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      {lastResult && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>{lastResult.processed}</strong> de <strong>{lastResult.total}</strong> e-mail(ns) processado(s)
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Button */}
      <button
        onClick={handleManualCheck}
        disabled={loading}
        className={`w-full py-2 px-4 rounded font-medium text-white transition ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
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
