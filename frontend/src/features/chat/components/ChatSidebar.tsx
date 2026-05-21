import { Plus, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useChats, useCreateChat, useDeleteChat, useLatestChatMessage } from "@/features/chat/hooks/useChats";
import { previewChatContent } from "@/features/chat/lib/chat-content";
import { useChatStore } from "@/features/chat/store/chat.store";

function ChatListItem({
  chat,
  active,
  deleteDisabled,
  onDelete,
  onSelect,
}: {
  chat: { chatId: string; createdAt: string };
  active: boolean;
  deleteDisabled: boolean;
  onDelete: (chatId: string) => void;
  onSelect: () => void;
}) {
  const { data: latestMessage } = useLatestChatMessage(chat.chatId);

  const title = latestMessage?.content ? previewChatContent(latestMessage.content) : "Chat nuevo";

  const subtitle = new Date(chat.createdAt).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={cn("group flex items-center gap-2 rounded-2xl p-2 transition-colors hover:bg-muted/70", active && "bg-primary-soft text-foreground")}>
      <button className="min-w-0 flex-1 text-left" onClick={onSelect}>
        <p className="truncate text-sm font-bold">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </button>
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100", active && "md:opacity-100")}
        disabled={deleteDisabled}
        onClick={(event) => {
          event.stopPropagation();
          onDelete(chat.chatId);
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function ChatSidebar({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const { data: chats = [] } = useChats();
  const createChat = useCreateChat();
  const deleteChat = useDeleteChat();
  const location = useLocation();
  const navigate = useNavigate();
  const activeChatId = useChatStore((state) => state.activeChatId);
  const streamingChatId = useChatStore((state) => state.streamingChatId);
  const setActiveChatId = useChatStore((state) => state.setActiveChatId);

  const chatHref = (chatId: string) => `/app/chat/${chatId}${location.search}`;

  function handleDelete(chatId: string) {
    const deletingActiveChat = activeChatId === chatId;
    const nextChat = chats.find((candidate) => candidate.chatId !== chatId);
    const previousActiveChatId = activeChatId;
    const nextChatId = nextChat?.chatId ?? null;

    if (deletingActiveChat) {
      setActiveChatId(nextChatId);
      navigate(nextChatId ? chatHref(nextChatId) : `/app/chat${location.search}`, { replace: true });
      onNavigate?.();
    }

    deleteChat.mutate(chatId, {
      onError: () => {
        if (!deletingActiveChat || !previousActiveChatId) return;
        setActiveChatId(previousActiveChatId);
        navigate(chatHref(previousActiveChatId), { replace: true });
      },
    });
  }

  return (
    <aside className={cn("flex h-full min-h-0 flex-col rounded-[2rem] border border-border/70 bg-card/85 p-4 backdrop-blur-sm", className)}>
      <Button
        className="w-full"
        disabled={createChat.isPending}
        onClick={() =>
          createChat.mutate(undefined, {
            onSuccess: (chat) => {
              navigate(chatHref(chat.chatId));
              onNavigate?.();
            },
          })
        }
      >
        <Plus className="h-4 w-4" /> Nuevo chat
      </Button>
      <div className="mt-4 min-h-0 space-y-2 overflow-y-auto pr-1">
        {chats.map((chat) => (
          <ChatListItem
            key={chat.chatId}
            chat={chat}
            active={activeChatId === chat.chatId}
            deleteDisabled={deleteChat.isPending || streamingChatId === chat.chatId}
            onDelete={handleDelete}
            onSelect={() => {
              setActiveChatId(chat.chatId);
              navigate(chatHref(chat.chatId));
              onNavigate?.();
            }}
          />
        ))}
      </div>
    </aside>
  );
}
