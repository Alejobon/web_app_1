import { PageHeader } from "@/components/common/PageHeader";
import { SettingsSidebar } from "@/features/settings/components/SettingsSidebar";
import { ThemeSelector } from "@/features/settings/components/ThemeSelector";
export function ThemeSettingsPage() { return <section className="grid gap-6 lg:grid-cols-[280px_1fr]"><SettingsSidebar /><div className="space-y-6"><PageHeader eyebrow="Tema" title="Elegí cómo se siente la app" description="Claro por defecto, oscuro opcional y sistema si preferís seguir el dispositivo." /><ThemeSelector /></div></section>; }
