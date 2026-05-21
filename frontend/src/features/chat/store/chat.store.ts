import { create } from "zustand";

type ChatState = {
  activeChatId: string | null;
  streamingChatId: string | null;
  streamingMessage: string;
  isGenerating: boolean;
  setActiveChatId: (id: string | null) => void;
  startStreaming: (chatId: string) => void;
  appendToken: (token: string) => void;
  resetStreaming: () => void;
  setGenerating: (value: boolean) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  activeChatId: null,
  streamingChatId: null,
  streamingMessage: "",
  isGenerating: false,
  setActiveChatId: (activeChatId) => set({ activeChatId }),
  startStreaming: (streamingChatId) => set({ streamingChatId, streamingMessage: "", isGenerating: true }),
  appendToken: (token) => set((state) => ({ streamingMessage: state.streamingMessage + token })),
  resetStreaming: () => set({ streamingChatId: null, streamingMessage: "" }),
  setGenerating: (isGenerating) => set({ isGenerating }),
}));
