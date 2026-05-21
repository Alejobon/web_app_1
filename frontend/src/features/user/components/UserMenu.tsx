import { ChevronDown } from "lucide-react";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { useCurrentUser } from "@/features/user/hooks/useCurrentUser";
import { UserAvatar } from "@/features/user/components/UserAvatar";
export function UserMenu() { const { data: user } = useCurrentUser(); return <div className="flex items-center gap-3 rounded-3xl border bg-card/75 p-2 pr-3"><UserAvatar user={user} /><div className="hidden min-w-0 sm:block"><p className="truncate text-sm font-black">{user?.username ?? "Tu espacio"}</p><p className="truncate text-xs text-muted-foreground">{user?.email ?? "Conectado"}</p></div><ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" /><LogoutButton variant="ghost" size="sm" className="hidden md:inline-flex">Salir</LogoutButton></div>; }
