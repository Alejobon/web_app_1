import type { ChatMessage } from "@/features/chat/chat.types";

const TASK_MODE_MARKER = "Pedido del usuario:";

export function stripInternalPrompt(content: string) {
  const markerIndex = content.lastIndexOf(TASK_MODE_MARKER);
  if (markerIndex === -1) return content;
  return content.slice(markerIndex + TASK_MODE_MARKER.length).trim();
}

export function displayChatContent(message: Pick<ChatMessage, "role" | "content">) {
  if (message.role !== "user") return message.content;
  return stripInternalPrompt(message.content);
}

export function previewChatContent(content: string) {
  const clean = stripInternalPrompt(content).trim().replace(/\s+/g, " ");
  return clean ? clean.slice(0, 48) : "Chat nuevo";
}

export function buildChatPrompt(content: string, search: string) {
  const mode = new URLSearchParams(search).get("mode");
  if (mode !== "tasks") return content;

  return [
    "Modo organización de tareas.",
    "Ayudá al usuario a transformar lo que le abruma en tareas pequeñas y posibles.",
    "Respondé con una breve validación emocional y luego una lista con bullets, una tarea concreta por línea.",
    "Cada tarea debe tener máximo 8 palabras.",
    TASK_MODE_MARKER,
    content,
  ].join("\n");
}
