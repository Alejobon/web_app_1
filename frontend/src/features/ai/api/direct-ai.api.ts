// Direct AI API — streams model responses without creating chats or persisting messages.
import { ApiError, apiUrl, getAccessToken } from "@/lib/api-client";

type DirectAIStreamEvent =
  | { type: "token"; content?: string }
  | { type: "done" }
  | { type: "error"; message?: string };

export type StreamDirectAIInput = {
  message: string;
  signal?: AbortSignal;
  onToken?: (token: string) => void;
  onDone?: () => void;
  onError?: (message: string) => void;
};

export async function streamDirectAI({ message, signal, onToken, onDone, onError }: StreamDirectAIInput) {
  const token = await getAccessToken();
  if (!token) throw new ApiError("Sesión requerida", 401);

  const response = await fetch(apiUrl("/ai/stream"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({ message }),
    signal,
  });

  if (!response.ok || !response.body) throw new Error("No se pudo iniciar el stream de IA.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const raw = event
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.replace(/^data:\s?/, ""))
        .join("\n");
      if (!raw) continue;

      const parsed = JSON.parse(raw) as DirectAIStreamEvent;
      if (parsed.type === "token" && parsed.content) {
        full += parsed.content;
        onToken?.(parsed.content);
      }
      if (parsed.type === "done") onDone?.();
      if (parsed.type === "error") {
        const errorMessage = parsed.message ?? "Error seguro";
        onError?.(errorMessage);
        throw new Error(errorMessage);
      }
    }
  }

  return full;
}
