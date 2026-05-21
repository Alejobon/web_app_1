import { Brain, MessageCircleHeart, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

const featureStories = [
  {
    icon: MessageCircleHeart,
    eyebrow: "Escucha",
    title: "Un chat que acompaña sin imponerse",
    text: "Podés escribir libremente lo que te pasa. El chat está pensado para acompañarte, ayudarte a poner en palabras lo que pesa y darte un punto de partida más claro.",
    tone: "bg-primary-soft text-primary",
    detailTitle: "Entrada simple",
    detailText: "No necesitás llegar con todo ordenado: empezás escribiendo como te salga.",
  },
  {
    icon: Brain,
    eyebrow: "Regulación",
    title: "Respiración y meditación para volver al eje",
    text: "Cuando hablar no alcanza, la app te ofrece respiración 4-7-8 y sesiones de meditación guiada según cómo te sentís y cuánto tiempo tenés.",
    tone: "bg-secondary-soft text-secondary",
    detailTitle: "Pausa útil",
    detailText: "Dos recursos concretos para bajar revoluciones sin salirte de la experiencia.",
  },
  {
    icon: ShieldCheck,
    eyebrow: "Acción",
    title: "Tareas pequeñas para pasar de la emoción al movimiento",
    text: "El planificador con IA convierte lo que querés resolver en tareas priorizadas y posibles, para que no te quedes atrapado en el ruido mental.",
    tone: "bg-accent-soft text-accent",
    detailTitle: "Próximo paso",
    detailText: "Ordená urgencia, dependencia y esfuerzo en una lista concreta de cosas por hacer.",
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

      <div className="mt-12 space-y-6 md:space-y-8">
        {featureStories.map((item, index) => (
          <Reveal key={item.title} delay={index * 120}>
            <article className="glass-panel grid gap-6 overflow-hidden rounded-[2.5rem] border border-border/60 p-6 shadow-soft transition-all duration-500 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:grid-cols-[0.72fr_1fr] md:p-8 lg:min-h-[24rem] lg:p-10">
              <div className="flex flex-col justify-between gap-6">
                <div className={`flex size-16 items-center justify-center rounded-[1.8rem] ${item.tone} shadow-sm`}>
                  <item.icon className="size-8" />
                </div>
                <div className="hidden rounded-[2rem] border border-border/60 bg-background/60 p-5 shadow-sm backdrop-blur md:block">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {item.detailTitle}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-foreground/85">
                    {item.detailText}
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">
                  {item.eyebrow}
                </p>
                <h3 className="mt-4 text-2xl font-black tracking-tight md:text-4xl">
                  {item.title}
                </h3>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base md:leading-8">
                  {item.text}
                </p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
