import { createFileRoute } from "@tanstack/react-router";
import { saveGmailToken } from "@/lib/api/emailAgent.functions";

export const Route = createFileRoute("/api/gmail-callback")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const url = new URL(request.url);
          const code = url.searchParams.get("code");
          const state = url.searchParams.get("state");

          if (!code) {
            return new Response(
              JSON.stringify({
                ok: false,
                error: "Missing authorization code",
              }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          // Save token (using "system" as userId for now)
          const result = await saveGmailToken({
            data: {
              code,
              userId: "system",
            },
          });

          // Redirect to success page
          if (result.ok) {
            return new Response(
              `
              <!DOCTYPE html>
              <html>
              <head>
                <title>Gmail Autorizado</title>
                <style>
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  }
                  .container {
                    text-align: center;
                    background: white;
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                  }
                  h1 {
                    color: #333;
                    margin: 0 0 10px 0;
                  }
                  p {
                    color: #666;
                    margin: 0;
                  }
                  .success {
                    color: #4caf50;
                    font-size: 48px;
                    margin: 20px 0;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="success">✓</div>
                  <h1>Gmail Autorizado!</h1>
                  <p>A integração com o Gmail foi configurada com sucesso.</p>
                  <p style="margin-top: 20px; font-size: 14px; color: #999;">
                    Você pode fechar esta aba e voltar para o aplicativo.
                  </p>
                </div>
              </body>
              </html>
              `,
              {
                status: 200,
                headers: { "Content-Type": "text/html; charset=utf-8" },
              }
            );
          }

          return new Response(
            JSON.stringify({ ok: false, error: "Failed to save token" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        } catch (err) {
          console.error("[gmail-callback] Error:", err);
          return new Response(
            `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Erro na Autorização</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  margin: 0;
                  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                }
                .container {
                  text-align: center;
                  background: white;
                  padding: 40px;
                  border-radius: 10px;
                  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                }
                h1 {
                  color: #333;
                  margin: 0 0 10px 0;
                }
                p {
                  color: #666;
                  margin: 0;
                }
                .error {
                  color: #f44336;
                  font-size: 48px;
                  margin: 20px 0;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="error">✗</div>
                <h1>Erro na Autorização</h1>
                <p>Ocorreu um erro ao processar a autorização do Gmail.</p>
                <p style="margin-top: 20px; font-size: 14px; color: #999;">
                  ${String(err)}
                </p>
              </div>
            </body>
            </html>
            `,
            {
              status: 500,
              headers: { "Content-Type": "text/html; charset=utf-8" },
            }
          );
        }
      },
    },
  },
});
