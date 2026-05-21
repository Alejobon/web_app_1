import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { HeartHandshake, Loader2, SendHorizontal, Smile } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { useChatMessages } from "@/features/chat/hooks/useChatMessages";
import { useChatStream } from "@/features/chat/hooks/useChatStream";
import { buildChatPrompt, displayChatContent } from "@/features/chat/lib/chat-content";
import { useChatStore } from "@/features/chat/store/chat.store";
import type { ChatMessageRole } from "@/features/chat/chat.types";
import { useCreateTask } from "@/features/tasks/hooks/useTasks";

const EMOJI_OPTIONS = [
  { emoji: "🙂", label: "sonrisa suave" },
  { emoji: "😌", label: "calma" },
  { emoji: "😔", label: "tristeza" },
  { emoji: "😢", label: "llanto" },
  { emoji: "😰", label: "ansiedad" },
  { emoji: "🫶", label: "cariño" },
  { emoji: "💙", label: "corazón azul" },
  { emoji: "🙏", label: "gratitud" },
  { emoji: "✨", label: "claridad" },
  { emoji: "🌿", label: "respiro" },
] as const;

function taskSuggestions(text: string) {
  return text
    .split("\n")
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter((line) => line.length > 0 && line.length <= 80);
}

function safeMarkdownHref(href: string | undefined) {
  if (!href) return undefined;
  try {
    const url = new URL(href, window.location.origin);
    if (["http:", "https:", "mailto:"].includes(url.protocol)) return href;
  } catch {
    return undefined;
  }
  return undefined;
}

function EmptyThread() {
  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-[1.75rem] bg-secondary-soft sm:h-16 sm:w-16 sm:rounded-[2rem]">
        <HeartHandshake className="h-8 w-8 text-foreground" />
      </div>
      <h2 className="text-xl font-black sm:text-2xl">Estoy aquí para escucharte</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Podés escribir libremente. Después ordenamos juntos lo que aparezca.
      </p>
    </div>
  );
}

function MessageBubble({
  content,
  pending = false,
  role,
  taskMode,
}: {
  content: string;
  pending?: boolean;
  role: Exclude<ChatMessageRole, "system">;
  taskMode: boolean;
}) {
  const createTask = useCreateTask();
  const isUser = role === "user";

  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? "max-w-[90%] rounded-3xl border border-primary/15 bg-primary-soft/85 px-4 py-3.5 text-sm leading-7 text-foreground shadow-sm sm:max-w-[82%] sm:px-5 sm:py-4"
            : "max-w-[94%] rounded-3xl border border-border/70 bg-card/95 px-4 py-3.5 text-sm leading-7 text-foreground shadow-sm sm:max-w-[88%] sm:px-5 sm:py-4"
        }
      >
        {isUser ? (
          <span className="whitespace-pre-wrap font-medium">{content}</span>
        ) : (
          <div className="space-y-3 text-foreground">
            {content ? (
              <ReactMarkdown
                components={{
                  p: (props) => <p {...props} className="leading-7 text-foreground" />,
                  li: (props) => <li {...props} className="leading-7 text-foreground" />,
                  strong: (props) => <strong {...props} className="font-black text-foreground" />,
                  a: ({ href, children }) => {
                    const safeHref = safeMarkdownHref(href);
                    if (!safeHref) return <span className="font-bold text-primary">{children}</span>;
                    return (
                      <a
                        href={safeHref}
                        className="font-bold text-primary underline"
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                      >
                        {children}
                      </a>
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            ) : (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Pensando...
              </span>
            )}

            {taskMode && content && (
              <div className="flex flex-wrap gap-2">
                {taskSuggestions(content).slice(0, 4).map((task) => (
                  <Button
                    key={task}
                    size="sm"
                    variant="secondary"
                    disabled={createTask.isPending}
                    onClick={() => createTask.mutate({ title: task, status: "pending" })}
                  >
                    Crear: {task}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {pending && <p className="mt-2 text-xs font-semibold text-muted-foreground">Enviando...</p>}
      </div>
    </div>
  );
}

function Composer({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: (content: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const composerRef = useRef<HTMLFormElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!emojiOpen) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (composerRef.current?.contains(event.target as Node)) return;
      setEmojiOpen(false);
    }

    window.addEventListener("pointerdown", closeOnOutsideClick);
    return () => window.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [emojiOpen]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || disabled) return;
    setEmojiOpen(false);
    setDraft("");
    await onSubmit(content);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Escape" && emojiOpen) {
      setEmojiOpen(false);
      return;
    }

    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  function insertEmoji(emoji: string) {
    if (disabled) return;

    const textarea = textareaRef.current;
    const selectionStart = textarea?.selectionStart ?? draft.length;
    const selectionEnd = textarea?.selectionEnd ?? selectionStart;
    const nextDraft = draft.slice(0, selectionStart) + emoji + draft.slice(selectionEnd);
    const nextCursor = selectionStart + emoji.length;

    setDraft(nextDraft);
    setEmojiOpen(false);

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  }

  return (
    <form
      ref={composerRef}
      onSubmit={handleSubmit}
      className="relative flex items-end gap-1.5 rounded-3xl border bg-card/95 p-1.5 shadow-soft sm:gap-2 sm:p-2"
    >
      <div className="relative shrink-0">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={emojiOpen ? "Cerrar selector de emojis" : "Abrir selector de emojis"}
          aria-expanded={emojiOpen}
          aria-haspopup="dialog"
          aria-controls="chat-emoji-picker"
          disabled={disabled}
          onClick={() => setEmojiOpen((current) => !current)}
        >
          <Smile className="h-5 w-5" />
        </button>

        {emojiOpen && (
          <div
            id="chat-emoji-picker"
            role="dialog"
            aria-label="Elegir emoji"
            className="absolute bottom-12 left-0 z-20 grid w-56 grid-cols-5 gap-1 rounded-2xl border border-border/80 bg-card/98 p-2 shadow-[0_18px_50px_hsl(var(--foreground)/0.14)] backdrop-blur-md"
            onKeyDown={(event) => {
              if (event.key === "Escape") setEmojiOpen(false);
            }}
          >
            {EMOJI_OPTIONS.map(({ emoji, label }) => (
              <button
                key={emoji}
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-lg transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label={`Insertar emoji ${label}`}
                onClick={() => insertEmoji(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      <textarea
        ref={textareaRef}
        rows={1}
        autoFocus
        value={draft}
        disabled={disabled}
        placeholder="Escribí lo que necesitás soltar..."
        className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-70"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
      />

      <Button
        type="submit"
        size="icon"
        className="shrink-0 rounded-full"
        disabled={disabled || !draft.trim()}
        aria-label="Enviar"
      >
        {disabled ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizontal className="h-5 w-5" />}
      </Button>
    </form>
  );
}

export function AssistantThread({ chatId }: { chatId: string }) {
  const location = useLocation();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const { data: messages = [], isError, isLoading } = useChatMessages(chatId);
  const stream = useChatStream(chatId);
  const streamingChatId = useChatStore((state) => state.streamingChatId);
  const streamingMessage = useChatStore((state) => state.streamingMessage);
  const isGenerating = useChatStore((state) => state.isGenerating);
  const [optimisticUserMessage, setOptimisticUserMessage] = useState<string | null>(null);
  const activeStream = streamingChatId === chatId;
  const taskMode = new URLSearchParams(location.search).get("mode") === "tasks";
  const disabled = stream.isPending || (isGenerating && activeStream);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, optimisticUserMessage, streamingMessage]);

  async function handleSubmit(content: string) {
    setOptimisticUserMessage(content);
    try {
      await stream.mutateAsync(buildChatPrompt(content, location.search));
    } finally {
      setOptimisticUserMessage(null);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/90 shadow-[0_20px_60px_hsl(var(--foreground)/0.08)] backdrop-blur-sm sm:rounded-[2rem]">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-gradient-to-b from-card/95 via-card/90 to-muted/20 p-3 sm:p-4 md:p-6">
        {isLoading && (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Cargando conversación...
          </div>
        )}

        {isError && <ErrorState message="No pude cargar este chat. Probá de nuevo." />}

        {!isLoading && !isError && messages.length === 0 && !optimisticUserMessage && !activeStream && <EmptyThread />}

        {!isLoading &&
          !isError &&
          messages.map((message) =>
            message.role === "system" ? null : (
              <MessageBubble
                key={message.messageId}
                role={message.role}
                content={displayChatContent(message)}
                taskMode={taskMode}
              />
            ),
          )}

        {optimisticUserMessage && (
          <MessageBubble role="user" content={optimisticUserMessage} pending={stream.isPending} taskMode={taskMode} />
        )}

        {activeStream && (streamingMessage || stream.isPending) && (
          <MessageBubble role="assistant" content={streamingMessage} taskMode={taskMode} />
        )}

        {stream.isError && <ErrorState message="No pude generar la respuesta. Intentá otra vez." />}

        <div ref={bottomRef} />
      </div>

      <div className="bg-gradient-to-t from-card via-card/95 to-transparent p-3 pt-2.5 sm:p-4 sm:pt-3 md:p-6 md:pt-4">
        <Composer disabled={disabled} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
