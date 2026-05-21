import { MessagePrimitive } from "@assistant-ui/react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { useCreateTask } from "@/features/tasks/hooks/useTasks";

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

export function UserMessage() {
  return (
    <MessagePrimitive.Root className="flex justify-end">
      <div className="max-w-[82%] rounded-3xl border border-primary/15 bg-primary-soft/85 px-5 py-4 text-sm leading-7 text-foreground shadow-sm">
        <MessagePrimitive.Parts
          components={{
            Text: ({ text }) => (
              <span className="whitespace-pre-wrap font-medium">{text}</span>
            ),
          }}
        />
      </div>
    </MessagePrimitive.Root>
  );
}

export function AssistantMessage() {
  const createTask = useCreateTask();
  const taskMode = new URLSearchParams(window.location.search).get("mode") === "tasks";

  return (
    <MessagePrimitive.Root className="flex justify-start">
      <div className="max-w-[88%] rounded-3xl border border-border/70 bg-card/95 px-5 py-4 text-sm leading-7 text-foreground shadow-sm">
        <MessagePrimitive.Parts
          components={{
            Text: ({ text }) => (
              <div className="space-y-3 text-foreground">
                <ReactMarkdown
                  components={{
                    p: (props) => (
                      <p {...props} className="leading-7 text-foreground" />
                    ),
                    li: (props) => (
                      <li {...props} className="leading-7 text-foreground" />
                    ),
                    strong: (props) => (
                      <strong {...props} className="font-black text-foreground" />
                    ),
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
                  {text}
                </ReactMarkdown>
                {taskMode && (
                  <div className="flex flex-wrap gap-2">
                    {taskSuggestions(text).slice(0, 4).map((task) => (
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
            ),
          }}
        />
      </div>
    </MessagePrimitive.Root>
  );
}
