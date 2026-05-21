import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { SettingsSidebar } from "@/features/settings/components/SettingsSidebar";
import { UserAvatar } from "@/features/user/components/UserAvatar";
import { useCurrentUser } from "@/features/user/hooks/useCurrentUser";
export function ProfileSettingsPage() { const { data: user } = useCurrentUser(); return <section className="grid gap-6 lg:grid-cols-[280px_1fr]"><SettingsSidebar /><div className="space-y-6"><PageHeader eyebrow="Perfil" title="Tu identidad en Desahógate" description="Usuario interno separado del usuario de Supabase Auth." /><Card><CardContent className="flex items-center gap-5 p-6"><UserAvatar user={user} /><div><p className="text-xl font-black">{user?.username ?? "Usuario"}</p><p className="text-sm text-muted-foreground">{user?.email ?? "Email pendiente"}</p><p className="mt-1 text-xs font-bold text-primary">Proveedor: {user?.authProvider ?? "Google"}</p></div></CardContent></Card></div></section>; }
