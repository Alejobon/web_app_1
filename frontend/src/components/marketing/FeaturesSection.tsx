import { Brain, MessageCircleHeart, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

const featureStories = [
  {
    icon: MessageCircleHeart,
    eyebrow: "Escucha",
    title: "Un chat que acompaña sin imponerse",
    text: "Puedes escribir libremente lo que te pasa. El chat está pensado para ayudarte a poner en palabras lo que pesa y encontrar un punto de partida más claro.",
    tone: "bg-primary-soft text-primary",
    detailTitle: "Entrada simple",
    detailText: "No necesitas llegar con todo ordenado: empiezas escribiendo como te salga.",
  },
  {
    icon: Brain,
    eyebrow: "Regulación",
    title: "Respiración y meditación para recuperar calma",
    text: "Cuando hablar no alcanza, la app ofrece respiración 4-7-8 y sesiones de meditación guiada según cómo te sientes y el tiempo que tienes.",
    tone: "bg-secondary-soft text-secondary",
    detailTitle: "Pausa útil",
    detailText: "Dos recursos concretos para bajar la intensidad sin salir de la experiencia.",
  },
  {
    icon: ShieldCheck,
    eyebrow: "Acción",
    title: "Tareas pequeñas para pasar de la emoción al movimiento",
    text: "El planificador con IA convierte lo que quieres resolver en tareas priorizadas y posibles, para que no te quedes atrapado en el ruido mental.",
    tone: "bg-accent-soft text-accent",
    detailTitle: "Próximo paso",
    detailText: "Ordena urgencia, dependencia y esfuerzo en una lista concreta de cosas por hacer.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="container py-16 md:py-24">
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="font-black text-primary">Beneficios</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
          Lo que hoy sí hace Desahógate U 2.0
        </h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base md:text-lg">
          Estas son las funciones que hoy ya forman parte del producto y acompañan el recorrido completo.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {featureStories.map((item, index) => (
          <Reveal key={item.title} delay={index * 120} className="h-full">
            <article className="glass-panel kinetic-card flex h-full flex-col gap-6 overflow-hidden rounded-[2.5rem] border border-border/60 p-6 shadow-soft md:p-8 lg:min-h-[31rem]">
              <div className="flex items-start justify-between gap-5">
                <div className={`flex size-16 items-center justify-center rounded-[1.8rem] ${item.tone} shadow-sm`}>
                  <item.icon className="kinetic-icon size-8" aria-hidden="true" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">
                  {item.eyebrow}
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight md:text-3xl">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
                  {item.text}
                </p>
              </div>
              <div className="mt-auto rounded-[2rem] border border-border/60 bg-background/60 p-5 shadow-sm backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {item.detailTitle}
                </p>
                <p className="mt-3 text-sm leading-6 text-foreground/85">
                  {item.detailText}
                </p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
