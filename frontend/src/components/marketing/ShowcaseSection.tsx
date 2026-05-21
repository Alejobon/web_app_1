import { CheckCircle2, ListTodo, MessageCircleHeart, Sparkles, Wind } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

const journey = [
  {
    icon: MessageCircleHeart,
    title: "Chat",
    text: "Un espacio para escribir lo que está pasando sin filtros ni presión.",
  },
  {
    icon: Wind,
    title: "Pausa",
    text: "Respiración y meditación para bajar la intensidad del momento.",
  },
  {
    icon: ListTodo,
    title: "Tareas",
    text: "Una lista corta para pasar de la preocupación a una acción posible.",
  },
];

const interfaceNotes = [
  "Una conversación clara, sin elementos que roben atención.",
  "Accesos directos a respirar, meditar y ordenar tareas.",
  "Mensajes y microacciones pensados para uso rápido entre clases.",
];

export function ShowcaseSection() {
  return (
    <section id="experiencia" className="container py-16 md:py-24">
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="font-black text-primary">Experiencia</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
          Una landing que explica el producto, no solo lo decora
        </h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base md:text-lg">
          Cambiamos las imágenes genéricas por una vista más fiel del recorrido real: hablar, regularte y convertir lo importante en pasos concretos.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
        <Reveal className="h-full">
          <article className="glass-panel relative h-full overflow-hidden rounded-[2.5rem] border border-border/60 p-6 shadow-soft transition-all duration-500 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:p-8 lg:p-10">
            <div className="ambient-grid absolute inset-0 opacity-60" />
            <div className="absolute -right-20 top-10 h-56 w-56 rounded-full bg-secondary/15 blur-3xl" />
            <div className="absolute -bottom-24 left-6 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />

            <div className="relative">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">
                    Recorrido real
                  </p>
                  <h3 className="mt-3 max-w-xl text-2xl font-black tracking-tight md:text-4xl">
                    Del “no sé qué hacer” a un siguiente paso manejable.
                  </h3>
                </div>
                <div className="w-fit rounded-full border border-primary/20 bg-primary-soft/60 px-4 py-2 text-sm font-black text-primary shadow-sm">
                  3 momentos
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {journey.map((item) => (
                  <div key={item.title} className="rounded-[2rem] border border-border/60 bg-background/70 p-5 shadow-sm backdrop-blur">
                    <div className="flex size-12 items-center justify-center rounded-[1.4rem] bg-primary-soft text-primary">
                      <item.icon className="size-6" aria-hidden="true" />
                    </div>
                    <h4 className="mt-5 text-xl font-black">{item.title}</h4>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[2rem] border border-border/60 bg-card/75 p-5 shadow-sm backdrop-blur md:p-6">
                <p className="text-sm font-black">Vista de uso</p>
                <div className="mt-4 space-y-3">
                  <div className="max-w-[88%] rounded-[1.35rem] bg-primary-soft/80 p-4 text-sm leading-6 text-foreground">
                    “Estoy saturado por parciales, entregas y cosas pendientes.”
                  </div>
                  <div className="ml-auto max-w-[88%] rounded-[1.35rem] bg-background/80 p-4 text-sm leading-6 text-muted-foreground">
                    Vamos paso a paso: primero respira, luego elegimos una tarea pequeña para hoy.
                  </div>
                </div>
              </div>
            </div>
          </article>
        </Reveal>

        <Reveal delay={120} className="h-full">
          <article className="glass-panel flex h-full flex-col rounded-[2.5rem] border border-border/60 p-6 shadow-soft md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-[1.5rem] bg-accent-soft text-accent">
                <Sparkles className="size-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-black">Diseño con intención</p>
                <p className="text-xs text-muted-foreground">Sereno, claro y usable en escritorio.</p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {interfaceNotes.map((note) => (
                <div key={note} className="flex gap-3 rounded-[1.5rem] border border-border/60 bg-background/60 p-4">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <p className="text-sm leading-6 text-muted-foreground">{note}</p>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-8">
              <div className="rounded-[2rem] bg-foreground p-5 text-background shadow-soft dark:bg-card dark:text-foreground">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
                  Prioridad
                </p>
                <p className="mt-3 text-2xl font-black tracking-tight">
                  Que el estudiante entienda rápido dónde empezar.
                </p>
              </div>
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  );
}
