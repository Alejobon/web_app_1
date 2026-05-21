import { ArrowRight, Brain, ListTodo, Wind } from "lucide-react";
import { Link } from "react-router-dom";
import { Reveal } from "@/components/marketing/Reveal";
import { Button } from "@/components/ui/button";

const microactions = [
  {
    icon: Wind,
    title: "Respiración",
    description: "Ejercicios guiados para regular la intensidad del momento.",
    detail: "Útil antes de responder un mensaje, entrar a clase o volver a estudiar.",
    href: "/p/breathing",
    tone: "bg-primary-soft text-primary",
  },
  {
    icon: Brain,
    title: "Meditación",
    description: "Pausas breves para recuperar foco y volver a sentir espacio interno.",
    detail: "Pensada para momentos de cansancio mental o ruido emocional.",
    href: "/p/meditation",
    tone: "bg-secondary-soft text-secondary",
  },
  {
    icon: ListTodo,
    title: "Tareas",
    description: "Pasos concretos para convertir sensación en dirección práctica.",
    detail: "Ideal cuando todo parece urgente y necesitas priorizar.",
    href: "/app/tasks",
    tone: "bg-accent-soft text-accent",
  },
];

export function MicroactionsSection() {
  return (
    <section id="microacciones" className="container py-16 md:py-24">
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="font-black text-primary">Microacciones</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
          Herramientas breves que aparecen en el momento correcto
        </h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base md:text-lg">
          Son accesos concretos para regularte o pasar a la acción cuando lo necesitas.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {microactions.map((item, index) => (
          <Reveal key={item.title} delay={index * 120}>
            <article className="glass-panel kinetic-card flex h-full flex-col rounded-[2.4rem] border border-border/60 p-6 shadow-soft md:p-8">
              <div className={`flex size-16 items-center justify-center rounded-[1.8rem] ${item.tone} shadow-sm`}>
                <item.icon className="kinetic-icon size-8" aria-hidden="true" />
              </div>
              <h3 className="mt-6 text-2xl font-black tracking-tight">{item.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-7 text-muted-foreground md:text-base">
                {item.description}
              </p>
              <p className="mt-5 rounded-[1.5rem] border border-border/60 bg-background/60 p-4 text-sm leading-6 text-foreground/85">
                {item.detail}
              </p>
              <Button asChild variant="outline" className="mt-8 w-full">
                <Link
                  to={item.href}
                  state={item.href === "/p/meditation" ? { from: "/" } : undefined}
                >
                  Explorar <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
