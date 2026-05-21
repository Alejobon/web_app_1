import { useQuery } from "@tanstack/react-query";
import { listMessages } from "@/features/chat/api/chat.api";
export function useChatMessages(chatId: string | null) { return useQuery({ queryKey: ["chats", chatId, "messages"], queryFn: () => listMessages(chatId!), enabled: Boolean(chatId) }); }
