interface TimelineEtapa {
  label: string;
  data: string;
  status: "concluido" | "em_progresso" | "aguardando";
}

interface TimelineStatusProps {
  etapas: TimelineEtapa[];
  etapaAtual: number; // índice da etapa atual (0-based)
}

export function TimelineStatus({ etapas, etapaAtual }: TimelineStatusProps) {
  const getStatusColor = (status: TimelineEtapa["status"], index: number) => {
    if (index < etapaAtual) return "#22c55e"; // Concluído = verde
    if (index === etapaAtual) return "#0bd0d7"; // Ativo = cyan
    return "#8da2b4"; // Aguardando = cinza
  };

  const getCircleStyle = (status: TimelineEtapa["status"], index: number) => {
    const color = getStatusColor(status, index);
    const isCurrent = index === etapaAtual;

    return {
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      background: color,
      border: `2px solid ${color}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontWeight: 700,
      boxShadow: isCurrent ? `0 0 16px ${color}80` : "none",
      position: "relative" as const,
    };
  };

  return (
    <div style={{ padding: "2rem 0" }}>
      <h3
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "#8da2b4",
          marginBottom: "2rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Status da Entrega
      </h3>

      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          paddingTop: "2rem",
        }}
      >
        {/* Linha conectora */}
        <div
          style={{
            position: "absolute",
            top: "16px",
            left: "0",
            right: "0",
            height: "2px",
            background: "rgba(13, 208, 215, 0.2)",
            zIndex: 0,
          }}
        />

        {/* Etapas */}
        {etapas.map((etapa, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flex: 1,
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Data acima */}
            <div
              style={{
                fontSize: "11px",
                color: "#8da2b4",
                marginBottom: "0.75rem",
                fontWeight: 500,
              }}
            >
              {etapa.data}
            </div>

            {/* Círculo */}
            <div style={getCircleStyle(etapa.status, idx)}>
              {idx < etapaAtual ? "✓" : idx === etapaAtual ? "●" : ""}
            </div>

            {/* Label abaixo */}
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: idx <= etapaAtual ? "#eaf3f8" : "#8da2b4",
                marginTop: "0.75rem",
                textAlign: "center",
                maxWidth: "80px",
              }}
            >
              {etapa.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
