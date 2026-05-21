import { NavLink } from "react-router-dom";
import { Bell, Palette, Shield, User } from "lucide-react";
import { cn } from "@/lib/cn";
const links = [{ to: "/app/settings/profile", label: "Perfil", icon: User }, { to: "/app/settings/theme", label: "Tema", icon: Palette }, { to: "/app/settings/security", label: "Seguridad", icon: Shield }, { to: "/app/settings/notifications", label: "Notificaciones", icon: Bell }];
export function SettingsSidebar() { return <aside className="rounded-3xl border bg-card/85 p-3">{links.map((link) => <NavLink key={link.to} to={link.to} className={({ isActive }) => cn("flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-muted-foreground", isActive && "bg-primary text-primary-foreground")}><link.icon className="h-4 w-4" />{link.label}</NavLink>)}</aside>; }
