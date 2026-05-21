// AppLayout — mobile-first: branded header with hamburger, sidebar on desktop.
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Bot, CheckSquare, Menu, Settings, X, Wind, Brain } from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { LoadingScreen } from "@/components/common/LoadingScreen";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { cn } from "@/lib/cn";
import { useRequireAuth } from "@/features/auth/hooks/useRequireAuth";
import { useUiStore } from "@/stores/ui.store";

const nav = [
  { to: "/app/chat", label: "Chat", icon: Bot },
  { to: "/app/tasks", label: "Tareas", icon: CheckSquare },
  { to: "/p/breathing", label: "Respiración", icon: Wind },
  { to: "/p/meditation", label: "Meditación", icon: Brain },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

function NavLinks({ collapsed = false, onClick }: { collapsed?: boolean; onClick?: () => void }) {
  const location = useLocation();
  const currentPath = `${location.pathname}${location.search}${location.hash}`;

  return (
    <nav className="flex flex-col gap-2">
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          state={
            item.to === "/p/meditation" ? { from: currentPath } : undefined
          }
          onClick={onClick}
          className={({ isActive }) =>
            cn(
              "flex items-center rounded-3xl px-4 py-3 text-sm font-black text-muted-foreground transition hover:bg-primary-soft/60 hover:text-foreground",
              collapsed ? "justify-center px-0" : "gap-3",
              isActive && "bg-primary text-primary-foreground shadow-soft",
            )
          }
        >
          <item.icon className="h-5 w-5" />
          <span className={cn("truncate transition-all", collapsed && "hidden")}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function AppLayout() {
  const location = useLocation();
  const { loading } = useRequireAuth();
  const { sidebarOpen, navDrawerOpen, setNavDrawerOpen, toggleSidebar } = useUiStore();
  const isChatRoute = location.pathname.startsWith("/app/chat");

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r bg-card/85 p-4 backdrop-blur-xl transition-all lg:block",
          sidebarOpen ? "w-64" : "w-20",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between">
            <Logo compact={!sidebarOpen} />
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <div className="mt-8">
            <NavLinks collapsed={!sidebarOpen} />
          </div>
          <div className="mt-auto">
            <LogoutButton
              variant={sidebarOpen ? "outline" : "ghost"}
              size={sidebarOpen ? "default" : "icon"}
              className={cn("mb-3", sidebarOpen ? "w-full" : "self-center")}
            >
              {sidebarOpen ? "Cerrar sesión" : undefined}
            </LogoutButton>
          </div>
        </div>
      </aside>

      {/* ── Mobile nav drawer ───────────────────────────────── */}
      {navDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm lg:hidden"
          onClick={() => setNavDrawerOpen(false)}
        >
          <div
            className="h-full w-72 max-w-[85vw] bg-card p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-16 items-center justify-between">
              <Logo />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setNavDrawerOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="mt-6" onClick={() => setNavDrawerOpen(false)}>
              <NavLinks />
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ────────────────────────────────────── */}
      <div className={cn("transition-all lg:pl-64", !sidebarOpen && "lg:pl-20")}>
        {/* Mobile header — brand gradient */}
        {!isChatRoute && (
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between bg-gradient-to-r from-primary to-primary/80 px-4 text-primary-foreground lg:hidden">
            <button
              onClick={() => setNavDrawerOpen(true)}
              className="rounded-full p-2 transition hover:bg-primary-foreground/10"
            >
              <Menu className="h-5 w-5" />
            </button>
            <p className="text-sm font-black">Desahógate U 2.0</p>
            <div className="w-9" /> {/* Spacer */}
          </header>
        )}

        <main className={cn(isChatRoute ? "p-0" : "p-4 md:p-8")}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
