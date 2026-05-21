import { PageHeader } from "@/components/common/PageHeader";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { DeleteAccountSection } from "@/features/settings/components/DeleteAccountSection";
import { PasswordSettingsForm } from "@/features/settings/components/PasswordSettingsForm";
import { SettingsSidebar } from "@/features/settings/components/SettingsSidebar";
export function SecuritySettingsPage() { return <section className="grid gap-6 lg:grid-cols-[280px_1fr]"><SettingsSidebar /><div className="space-y-6"><PageHeader eyebrow="Seguridad" title="Sesión y acceso" description="El backend recibe Authorization: Bearer <supabase_access_token>. Nada de userId manual." /><div className="rounded-3xl border bg-card p-5"><p className="font-black">Proveedor conectado: Google</p><LogoutButton className="mt-4" variant="destructive" /></div><PasswordSettingsForm /><DeleteAccountSection /></div></section>; }
