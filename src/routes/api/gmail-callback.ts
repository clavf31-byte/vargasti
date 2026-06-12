import { createFileRoute } from "@tanstack/react-router";
import { saveGmailToken } from "@/lib/api/gmailAuth.functions";

export const Route = createFileRoute("/api/gmail-callback")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const url = new URL(request.url);
          const code = url.searchParams.get("code");
          const error = url.searchParams.get("error");

          if (error) {
            return new Response(`<h1>Erro</h1><p>${error}</p>`, {
              status: 400,
              headers: { "Content-Type": "text/html" },
            });
          }

          if (!code) {
            return new Response("<h1>Erro</h1><p>Código de autorização não encontrado</p>", {
              status: 400,
              headers: { "Content-Type": "text/html" },
            });
          }

          await saveGmailToken({ code });

          return new Response(
            `<html>
              <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0a0e27;">
                <div style="text-align: center; background: #151b35; padding: 40px; border-radius: 12px; border: 1px solid #2d3a5f;">
                  <h1 style="color: #3BDC8A;">✅ Sucesso!</h1>
                  <p style="color: #8892a6;">Gmail foi autorizado com sucesso.</p>
                  <p style="color: #5a6f8f; font-size: 12px;">Você pode fechar esta aba e voltar para o app.</p>
                </div>
              </body>
            </html>`,
            {
              status: 200,
              headers: { "Content-Type": "text/html" },
            }
          );
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          return new Response(
            `<html>
              <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0a0e27;">
                <div style="text-align: center; background: #151b35; padding: 40px; border-radius: 12px; border: 1px solid #2d3a5f;">
                  <h1 style="color: #ff6b6b;">❌ Erro</h1>
                  <p style="color: #8892a6;">${errorMessage}</p>
                </div>
              </body>
            </html>`,
            {
              status: 500,
              headers: { "Content-Type": "text/html" },
            }
          );
        }
      },
    },
  },
});
