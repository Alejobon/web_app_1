import { ArrowRight, Brain, ListTodo, Wind } from "lucide-react";
import { Link } from "react-router-dom";
import { Reveal } from "@/components/marketing/Reveal";
import { Button } from "@/components/ui/button";

const microactions = [
  {
    icon: Wind,
    title: "Respiración",
    description: "Ejercicios guiados para regular la intensidad del momento.",
    href: "/p/breathing",
    tone: "bg-primary-soft text-primary",
  },
  {
    icon: Brain,
    title: "Meditación",
    description: "Pausas breves para recuperar foco y volver a sentir espacio interno.",
    href: "/p/meditation",
    tone: "bg-secondary-soft text-secondary",
  },
  {
    icon: ListTodo,
    title: "Tareas",
    description: "Pasos concretos para convertir sensación en dirección práctica.",
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
          No son extras decorativos: son accesos concretos para regularte o pasar a la acción cuando lo necesitás.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {microactions.map((item, index) => (
          <Reveal key={item.title} delay={index * 120}>
            <article className="glass-panel flex h-full flex-col rounded-[2.4rem] border border-border/60 p-6 shadow-soft transition-all duration-500 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:p-8">
              <div className={`flex size-16 items-center justify-center rounded-[1.8rem] ${item.tone} shadow-sm`}>
                <item.icon className="size-8" />
              </div>
              <h3 className="mt-6 text-2xl font-black tracking-tight">{item.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-7 text-muted-foreground md:text-base">
                {item.description}
              </p>
              <Button asChild variant="outline" className="mt-8 w-full">
                <Link to={item.href}>
                  Explorar <ArrowRight className="size-4" />
                </Link>
              </Button>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
