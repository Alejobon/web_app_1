import type { ChatModelAdapter, ThreadMessage } from "@assistant-ui/react";
import { createChat, streamChatMessage } from "@/features/chat/api/chat.api";
import { useChatStore } from "@/features/chat/store/chat.store";

function messageText(message: ThreadMessage | undefined) {
  if (!message) return "";
  return message.content.map((part) => part.type === "text" ? part.text : "").join("\n").trim();
}

function withModePrompt(content: string) {
  const mode = new URLSearchParams(window.location.search).get("mode");
  if (mode !== "tasks") return content;
  return [
    "Modo organización de tareas.",
    "Ayudá al usuario a transformar lo que le abruma en tareas pequeñas y posibles.",
    "Respondé con una breve validación emocional y luego una lista con bullets, una tarea concreta por línea.",
    "Cada tarea debe tener máximo 8 palabras.",
    "Pedido del usuario:",
    content,
  ].join("\n");
}

export const assistantModelAdapter: ChatModelAdapter = {
  async *run({ messages, abortSignal }) {
    const latestUser = [...messages].reverse().find((message) => message.role === "user");
    const content = messageText(latestUser);
    if (!content) return;

    const store = useChatStore.getState();
    let chatId = store.activeChatId;
    if (!chatId) {
      const chat = await createChat();
      chatId = chat.chatId;
      store.setActiveChatId(chatId);
    }

    let text = "";
    const queue: string[] = [];
    let resolveNext: (() => void) | null = null;
    let completed = false;
    let streamError: Error | null = null;

    const notify = () => {
      resolveNext?.();
      resolveNext = null;
    };

    const streamPromise = streamChatMessage({
      chatId,
      content: withModePrompt(content),
      signal: abortSignal,
      onToken: (token) => {
        queue.push(token);
        notify();
      },
      onDone: () => {
        completed = true;
        notify();
      },
      onError: (message) => {
        streamError = new Error(message);
        completed = true;
        notify();
      },
    }).catch((error) => {
      streamError = error instanceof Error ? error : new Error("Error de streaming");
      completed = true;
      notify();
    });

    while (!completed || queue.length > 0) {
      if (queue.length === 0) {
        await new Promise<void>((resolve) => {
          resolveNext = resolve;
        });
        continue;
      }

      while (queue.length > 0) {
        text += queue.shift() ?? "";
        yield { content: [{ type: "text", text }] };
      }
    }

    await streamPromise;

    if (streamError) throw streamError;
  },
};
