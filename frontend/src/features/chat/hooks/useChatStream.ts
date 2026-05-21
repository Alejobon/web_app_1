import { useMutation, useQueryClient } from "@tanstack/react-query";
import { streamChatMessage } from "@/features/chat/api/chat.api";
import { useChatStore } from "@/features/chat/store/chat.store";

export function useChatStream(chatId: string | null) {
  const queryClient = useQueryClient();
  const appendToken = useChatStore((state) => state.appendToken);
  const resetStreaming = useChatStore((state) => state.resetStreaming);
  const setGenerating = useChatStore((state) => state.setGenerating);
  const startStreaming = useChatStore((state) => state.startStreaming);

  return useMutation({
    mutationFn: async (content: string) => {
      if (!chatId) throw new Error("Seleccioná o creá un chat primero.");
      startStreaming(chatId);
      return streamChatMessage({ chatId, content, onToken: appendToken });
    },
    onSettled: () => {
      setGenerating(false);

      if (chatId) {
        void Promise.all([
          queryClient.invalidateQueries({ queryKey: ["chats"] }),
          queryClient.invalidateQueries({ queryKey: ["chats", chatId, "latest-message"] }),
          queryClient.invalidateQueries({ queryKey: ["chats", chatId, "messages"] }),
        ]).finally(resetStreaming);
        return;
      }

      resetStreaming();
    },
  });
}
