// Chat API — CRUD for chats and messages, plus an SSE stream endpoint for assistant responses.
// Maps backend field names (chatId, messageId, etc.) to frontend types.
import { DEFAULT_HISTORY_LIMIT } from "@/lib/constants";
import { ApiError, apiBaseUrl, apiClient, getAccessToken } from "@/lib/api-client";
import type { ChatMessage, ChatSummary, CreateChatInput, CreateMessageInput, StreamChatInput } from "@/features/chat/chat.types";
type BackendChat = { chatId: string; userId: string; createdAt: string };
type BackendMessage = { messageId: string; chatId: string; role: ChatMessage["role"]; content: string; createdAt: string };
const mapChat = (chat: BackendChat): ChatSummary => ({ chatId: chat.chatId, userId: chat.userId, createdAt: chat.createdAt });
const mapMessage = (message: BackendMessage): ChatMessage => ({ messageId: message.messageId, chatId: message.chatId, role: message.role, content: message.content, createdAt: message.createdAt, status: "done" });
const segment = (value: string) => encodeURIComponent(value);
export async function listChats() { return (await apiClient<BackendChat[]>("/chats")).map(mapChat); }
export async function getChat(chatId: string) { return mapChat(await apiClient<BackendChat>("/chats/" + segment(chatId))); }
export async function createChat() { return mapChat(await apiClient<BackendChat>("/chats", { method: "POST", body: JSON.stringify({}) })); }
export async function updateChat(chatId: string, input: Partial<CreateChatInput>) { return mapChat(await apiClient<BackendChat>("/chats/" + segment(chatId), { method: "PUT", body: JSON.stringify(input) })); }
export function deleteChat(chatId: string) { return apiClient<void>("/chats/" + segment(chatId), { method: "DELETE" }); }
export async function listMessages(chatId: string, limit = 50, sort: "asc" | "desc" = "asc") { return (await apiClient<BackendMessage[]>("/messages?" + new URLSearchParams({ chat_id: chatId, limit: String(limit), sort }).toString())).map(mapMessage); }
export async function getLatestMessage(chatId: string) {
  try {
    return mapMessage(await apiClient<BackendMessage>("/messages/latest/" + segment(chatId)));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
export async function createMessage(input: CreateMessageInput) { return mapMessage(await apiClient<BackendMessage>("/messages", { method: "POST", body: JSON.stringify(input) })); }
export function updateMessage(messageId: string, input: Partial<Pick<ChatMessage, "role" | "content">>) { return apiClient<BackendMessage>("/messages/" + segment(messageId), { method: "PUT", body: JSON.stringify(input) }); }
export function deleteMessage(messageId: string) { return apiClient<void>("/messages/" + segment(messageId), { method: "DELETE" }); }
export async function streamChatMessage({ chatId, content, historyLimit = DEFAULT_HISTORY_LIMIT, signal, onToken, onDone, onError }: StreamChatInput) {
  const token = await getAccessToken();
  if (!token) throw new ApiError("Sesión requerida", 401);
  const response = await fetch(apiBaseUrl + "/chats/" + segment(chatId) + "/messages/stream", { method: "POST", headers: { "Content-Type": "application/json", Accept: "text/event-stream", Authorization: "Bearer " + token }, body: JSON.stringify({ content, historyLimit }), signal });
  if (!response.ok || !response.body) throw new Error("No se pudo iniciar el stream del chat.");
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ""; let full = "";
  while (true) { const { done, value } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const events = buffer.split("\n\n"); buffer = events.pop() ?? ""; for (const event of events) { const raw = event.split("\n").filter((line) => line.startsWith("data:")).map((line) => line.replace(/^data:\s?/, "")).join("\n"); if (!raw) continue; const parsed = JSON.parse(raw) as { type: "token" | "done" | "error"; content?: string; messageId?: string; message?: string }; if (parsed.type === "token" && parsed.content) { full += parsed.content; onToken?.(parsed.content); } if (parsed.type === "done") onDone?.(parsed.messageId); if (parsed.type === "error") { onError?.(parsed.message ?? "Error seguro"); throw new Error(parsed.message ?? "Error seguro"); } } }
  return full;
}
