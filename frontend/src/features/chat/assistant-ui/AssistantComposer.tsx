import { ComposerPrimitive } from "@assistant-ui/react";
import { Mic, SendHorizontal, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AssistantComposer() {
  return (
    <ComposerPrimitive.Root className="flex items-end gap-2 rounded-3xl border bg-card/95 p-2 shadow-soft">
      <button
        type="button"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
        aria-label="Emoji"
      >
        <Smile className="h-5 w-5" />
      </button>

      <ComposerPrimitive.Input
        rows={1}
        autoFocus
        placeholder="Escribí lo que necesitás soltar..."
        className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
      />

      <button
        type="button"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
        aria-label="Grabar audio"
      >
        <Mic className="h-5 w-5" />
      </button>

      <ComposerPrimitive.Send asChild>
        <Button
          size="icon"
          className="shrink-0 rounded-full"
          aria-label="Enviar"
        >
          <SendHorizontal className="h-5 w-5" />
        </Button>
      </ComposerPrimitive.Send>
    </ComposerPrimitive.Root>
  );
}
