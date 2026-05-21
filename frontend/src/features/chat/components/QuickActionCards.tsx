import { Brain, ListTodo, Wind } from "lucide-react";
import { Link } from "react-router-dom";

const cards = [
  {
    href: "/p/breathing",
    label: "Ejercicios de Respiración",
    icon: Wind,
    bg: "bg-secondary-soft/80",
    iconBg: "bg-secondary/15",
    text: "text-foreground",
    iconColor: "text-secondary",
    border: "border-secondary/20",
    hover: "hover:bg-secondary-soft",
  },
  {
    href: "/p/meditation",
    label: "Meditación Guiada",
    icon: Brain,
    bg: "bg-primary-soft/70",
    iconBg: "bg-primary/15",
    text: "text-foreground",
    iconColor: "text-primary",
    border: "border-primary/20",
    hover: "hover:bg-primary-soft/90",
  },
  {
    href: "/app/tasks",
    label: "Organiza tus Tareas",
    icon: ListTodo,
    bg: "bg-accent-soft/80",
    iconBg: "bg-accent/15",
    text: "text-foreground",
    iconColor: "text-accent-foreground",
    border: "border-accent/20",
    hover: "hover:bg-accent-soft",
  },
];

export function QuickActionCards() {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.href}
            to={card.href}
            className={`flex items-center gap-3 rounded-2xl border ${card.border} ${card.bg} p-3 transition-colors ${card.hover} sm:flex-col sm:items-center sm:gap-2 md:p-4`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg} md:h-12 md:w-12`}>
              <Icon className={`h-5 w-5 ${card.iconColor} md:h-6 md:w-6`} />
            </div>
            <span className={`text-left text-[11px] font-semibold leading-tight ${card.text} sm:text-center md:text-xs`}>
              {card.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
