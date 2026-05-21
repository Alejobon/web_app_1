import { PageHeader } from "@/components/common/PageHeader";
import { SettingsSidebar } from "@/features/settings/components/SettingsSidebar";
import { EmailSettingsForm } from "@/features/settings/components/EmailSettingsForm";
export function NotificationsSettingsPage() { return <section className="grid gap-6 lg:grid-cols-[280px_1fr]"><SettingsSidebar /><div className="space-y-6"><PageHeader eyebrow="Notificaciones" title="Recordatorios suaves" description="Placeholders para preferencias futuras sin inventar endpoints." /><EmailSettingsForm /></div></section>; }
