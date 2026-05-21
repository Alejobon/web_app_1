import { Menu, MessagesSquare } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";

export function ChatHeader({ onOpenChats }: { onOpenChats: () => void }) {
  const setNavDrawerOpen = useUiStore((state) => state.setNavDrawerOpen);

  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-primary to-primary-soft shadow-sm lg:hidden">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <button
          onClick={() => setNavDrawerOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
          aria-label="Abrir navegación"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-black tracking-tight text-white md:text-xl">
          Desahógate U 2.0
        </h1>

        <button
          onClick={onOpenChats}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
          aria-label="Abrir chats"
        >
          <MessagesSquare className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
