export type AnthropicTextBlock = { type: "text"; text: string };
export type AnthropicToolUseBlock = { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };
export type AnthropicContentBlock = AnthropicTextBlock | AnthropicToolUseBlock | Record<string, unknown>;
export type AnthropicMessage = {
  role: "user" | "assistant";
  content: string | AnthropicContentBlock[];
};

export type AnthropicResponse = {
  stop_reason?: string | null;
  content: AnthropicContentBlock[];
};

export async function createAnthropicMessage(apiKey: string, body: Record<string, unknown>): Promise<AnthropicResponse> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${details}`);
  }

  return response.json() as Promise<AnthropicResponse>;
}