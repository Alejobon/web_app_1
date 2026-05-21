import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createChat,
  deleteChat,
  getLatestMessage,
  listChats,
} from "@/features/chat/api/chat.api";
import type { ChatSummary } from "@/features/chat/chat.types";
import { useChatStore } from "@/features/chat/store/chat.store";
export function useChats() {
  return useQuery({ queryKey: ["chats"], queryFn: listChats });
}
export function useCreateChat() {
  const queryClient = useQueryClient();
  const setActiveChatId = useChatStore((state) => state.setActiveChatId);

  return useMutation({
    mutationFn: createChat,
    onSuccess: async (chat) => {
      setActiveChatId(chat.chatId);
      queryClient.setQueryData<ChatSummary[]>(["chats"], (current) => {
        const withoutCurrent =
          current?.filter((item) => item.chatId !== chat.chatId) ?? [];
        return [chat, ...withoutCurrent];
      });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
}
export function useDeleteChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteChat,
    onMutate: async (chatId) => {
      await queryClient.cancelQueries({ queryKey: ["chats"] });
      const previousChats = queryClient.getQueryData<ChatSummary[]>(["chats"]);
      queryClient.setQueryData<ChatSummary[]>(
        ["chats"],
        (current) => current?.filter((chat) => chat.chatId !== chatId) ?? [],
      );
      queryClient.removeQueries({
        queryKey: ["chats", chatId, "latest-message"],
      });
      queryClient.removeQueries({ queryKey: ["chats", chatId, "messages"] });
      return { previousChats };
    },
    onError: (_error, _chatId, context) => {
      if (context?.previousChats)
        queryClient.setQueryData(["chats"], context.previousChats);
    },
    onSuccess: (_data, chatId) => {
      queryClient.removeQueries({
        queryKey: ["chats", chatId, "latest-message"],
      });
      queryClient.removeQueries({ queryKey: ["chats", chatId, "messages"] });
    },
    onSettled: (_data, error) => {
      if (!error) return;
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
}
export function useLatestChatMessage(chatId: string) {
  return useQuery({
    queryKey: ["chats", chatId, "latest-message"],
    queryFn: () => getLatestMessage(chatId),
  });
}
