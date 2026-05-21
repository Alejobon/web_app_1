import { useEffect, useState } from "react";
import { PanelLeft, X } from "lucide-react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AssistantThread } from "@/features/chat/assistant-ui/AssistantThread";
import { ChatDecorations } from "@/features/chat/components/ChatDecorations";
import { ChatEmptyState } from "@/features/chat/components/ChatEmptyState";
import { ChatHeader } from "@/features/chat/components/ChatHeader";
import { ChatProvider } from "@/features/chat/components/ChatProvider";
import { ChatSidebar } from "@/features/chat/components/ChatSidebar";
import { useChatStore } from "@/features/chat/store/chat.store";

export function ChatShell() {
  const { chatId } = useParams<{ chatId?: string }>();
  const activeChatId = chatId ?? null;
  const setActiveChatId = useChatStore((state) => state.setActiveChatId);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setActiveChatId(activeChatId);
  }, [activeChatId, setActiveChatId]);

  useEffect(() => () => setActiveChatId(null), [setActiveChatId]);
  return (
    <ChatProvider>
      <div className="relative flex min-h-[100dvh] flex-col bg-background">
        <ChatHeader onOpenChats={() => setMobileSidebarOpen(true)} />

        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          <ChatDecorations />

          <main className="relative flex min-h-0 flex-1 bg-gradient-to-b from-background via-background to-muted/30">
            <div className="flex min-h-0 w-full flex-1 flex-col xl:grid xl:grid-cols-[320px_minmax(0,1fr)]">
              <div className="border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur-sm xl:hidden">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-foreground">Tus chats</p>
                    <p className="text-xs text-muted-foreground">
                      {activeChatId ? "Seguís donde lo dejaste." : "Elegí o creá una conversación."}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => setMobileSidebarOpen(true)}>
                    <PanelLeft className="h-4 w-4" />
                    Ver chats
                  </Button>
                </div>
              </div>

              <div className="hidden min-h-0 border-r border-border/60 bg-card/45 xl:block">
                <ChatSidebar className="rounded-none border-0 bg-transparent p-5 shadow-none backdrop-blur-0" />
              </div>

              <div className="relative flex min-h-0 flex-1 flex-col bg-background/60 backdrop-blur-sm xl:p-5">
                <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4 xl:p-0">
                  {activeChatId ? <AssistantThread chatId={activeChatId} /> : <ChatEmptyState />}
                </div>
              </div>
            </div>
          </main>
        </div>

        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-[60] bg-foreground/40 backdrop-blur-sm xl:hidden" onClick={() => setMobileSidebarOpen(false)}>
            <div
              className="absolute inset-y-0 left-0 flex w-full max-w-sm flex-col border-r border-border/60 bg-background p-4 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-lg font-black text-foreground">Conversaciones</p>
                  <p className="text-sm text-muted-foreground">Entrá, creá o retomá un chat.</p>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setMobileSidebarOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="min-h-0 flex-1">
                <ChatSidebar
                  className="rounded-[1.75rem] border-border/60 bg-card/95"
                  onNavigate={() => setMobileSidebarOpen(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </ChatProvider>
  );
}
