// Domain types for chat summaries, messages, and streaming input.
export type ChatSummary = { chatId: string; userId: string; createdAt: string };
export type ChatMessageRole = "user" | "assistant" | "system";
export type ChatMessage = { messageId: string; chatId: string; role: ChatMessageRole; content: string; status?: "streaming" | "done" | "error"; createdAt: string };
export type CreateChatInput = Record<string, never>;
export type CreateMessageInput = { chatId: string; role: ChatMessageRole; content: string };
export type StreamChatInput = { chatId: string; content: string; historyLimit?: number; signal?: AbortSignal; onToken?: (token: string) => void; onDone?: (messageId?: string) => void; onError?: (message: string) => void };
