import { PageHeader } from "@/components/common/PageHeader";
import { SettingsSidebar } from "@/features/settings/components/SettingsSidebar";
export function SettingsPage() { return <section className="space-y-6"><PageHeader eyebrow="Settings" title="Personalizá tu espacio" description="Perfil, tema, seguridad y notificaciones futuras." /><SettingsSidebar /></section>; }
