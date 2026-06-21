import client from "@/config/client";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ExcelEditor } from "@/components/excel/ExcelEditor";

export const Route = createFileRoute("/ferramentas/excel")({
  head: () => ({ meta: [{ title: `Editor de Excel · ${client.name}` }] }),
  component: ExcelPage,
});

function ExcelPage() {
  return (
    <AppShell>
      <ExcelEditor />
    </AppShell>
  );
}
