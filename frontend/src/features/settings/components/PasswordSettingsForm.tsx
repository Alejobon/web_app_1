import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export function PasswordSettingsForm() { return <div className="space-y-3 rounded-3xl border bg-card p-5"><h3 className="text-xl font-black">Contraseña</h3><p className="text-sm text-muted-foreground">Si tu proveedor lo permite, acá se podrá cambiar más adelante.</p><Input type="password" placeholder="Nueva contraseña" disabled /><Button variant="outline" disabled>Disponible próximamente</Button></div>; }
