import client from "@/config/client";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { WhatsappAgent } from "@/components/whatsapp/WhatsappAgent";

export const Route = createFileRoute("/ferramentas/whatsapp")({
  head: () => ({ meta: [{ title: `Agente WhatsApp · ${client.name}` }] }),
  component: WhatsappPage,
});

function WhatsappPage() {
  return (
    <AppShell>
      <WhatsappAgent />
    </AppShell>
  );
}
