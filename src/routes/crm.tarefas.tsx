import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { CRMLayout } from "@/components/crm/CRMLayout";
import { TarefasTable } from "@/components/crm/TarefasTable";
import { PageHeader } from "@/components/ui";

export const Route = createFileRoute("/crm/tarefas")({
  head: () => ({ meta: [{ title: "Tarefas · CRM VargasTI" }] }),
  component: TarefasPage,
});

function TarefasPage() {
  const { user } = useAuth();
  const [tarefas, setTarefas] = useState<any[]>([]);

  const addTarefa = () => {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const newTarefa = {
      titulo: "",
      descricao: "",
      status: "aberta" as const,
      prioridade: "normal" as const,
      data_vencimento: amanha.toISOString().split("T")[0],
    };
    setTarefas([...tarefas, newTarefa]);
  };

  const updateTarefa = (index: number, tarefa: any) => {
    const updated = [...tarefas];
    updated[index] = tarefa;
    setTarefas(updated);
  };

  const removeTarefa = (index: number) => {
    setTarefas(tarefas.filter((_, i) => i !== index));
  };

  const toggleStatus = (index: number) => {
    const tarefa = tarefas[index];
    const statusMap: Record<string, string> = {
      aberta: "em_progresso",
      em_progresso: "concluida",
      concluida: "aberta",
    };
    updateTarefa(index, {
      ...tarefa,
      status: statusMap[tarefa.status] as any,
    });

  };

  return (
    <CRMLayout>
      <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
        <PageHeader
          title="Tarefas & Follow-ups"
          subtitle={`${tarefas.length} tarefas`}
          icon={<CheckCircle2 size={32} />}
          iconClass="text-brand"
        />

        <div style={{ marginTop: "20px" }}>
          <TarefasTable
            tarefas={tarefas}
            onAddTarefa={addTarefa}
            onUpdateTarefa={updateTarefa}
            onRemoveTarefa={removeTarefa}
            onToggleStatus={toggleStatus}
          />
        </div>
      </div>
    </CRMLayout>
  );
}
