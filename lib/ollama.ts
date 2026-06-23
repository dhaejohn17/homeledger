/**
 * Minimal Ollama client. The app talks to a locally running Ollama instance
 * over HTTP. Configure OLLAMA_BASE_URL and OLLAMA_MODEL in .env.
 */
const BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const MODEL = process.env.OLLAMA_MODEL || "llama3:latest";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export class OllamaError extends Error {}

/** Some models (e.g. qwen3) emit <think>…</think>. Strip it so output stays clean. */
export function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

async function ping(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(2500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Stream a chat completion as plain text chunks. Yields incremental tokens. */
export async function* streamChat(messages: ChatMessage[]): AsyncGenerator<string> {
  if (!(await ping())) {
    throw new OllamaError(
      `Couldn't reach Ollama at ${BASE_URL}. Make sure it's running (\`ollama serve\`) and OLLAMA_MODEL ("${MODEL}") is pulled.`,
    );
  }

  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages, stream: true, think: false }),
  });

  if (!res.ok || !res.body) {
    throw new OllamaError(`Ollama returned ${res.status}. Is the model "${MODEL}" available?`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let insideThink = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const json = JSON.parse(line);
        let chunk: string = json.message?.content ?? "";
        if (!chunk) continue;
        // Defensive inline <think> handling for reasoning models.
        if (insideThink || chunk.includes("<think>")) {
          const merged = (insideThink ? "<think>" : "") + chunk;
          insideThink = merged.includes("<think>") && !merged.includes("</think>");
          chunk = merged.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<\/?think>/gi, "");
          if (insideThink) continue;
        }
        if (chunk) yield chunk;
      } catch {
        /* ignore partial / malformed lines */
      }
    }
  }
}

/** One-shot generation that expects a JSON object back. Returns null on any failure. */
export async function extractJson<T = unknown>(
  system: string,
  user: string,
): Promise<T | null> {
  if (!(await ping())) return null;
  try {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        think: false,
        format: "json",
        options: { temperature: 0 },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = stripThinking(String(data.message?.content ?? ""));
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}

export const ollamaModel = MODEL;
