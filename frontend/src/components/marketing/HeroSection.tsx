import { ArrowRight, CheckCircle2, ListTodo, MessageCircleHeart, Sparkles, Wind } from "lucide-react";
import { Link } from "react-router-dom";
import { Reveal } from "@/components/marketing/Reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const heroStats = [
  { value: "Chat IA", label: "Escribe libremente y empieza a ordenar lo que te pasa." },
  { value: "4-7-8", label: "Respiración guiada para bajar la intensidad del momento." },
  { value: "Tareas", label: "Convierte lo que te abruma en pasos concretos y posibles." },
];

const supportFlow = [
  { icon: MessageCircleHeart, title: "Hablar", text: "Saca lo que tienes en la cabeza sin tener que explicarlo perfecto." },
  { icon: Wind, title: "Respirar", text: "Baja la intensidad con una pausa guiada y concreta." },
  { icon: ListTodo, title: "Ordenar", text: "Cierra con próximos pasos pequeños y realistas." },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pb-12 pt-12 md:pb-20 md:pt-24 lg:pb-28 lg:pt-28">
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/10 via-secondary/6 to-transparent" />
      <div className="animate-drift absolute left-[-12%] top-28 h-80 w-80 wave-yellow opacity-70" />
      <div className="animate-float-slow absolute bottom-[-8rem] right-[-12%] h-[28rem] w-[34rem] wave-blue opacity-80" />

      <div className="container relative space-y-12 md:space-y-16">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] xl:gap-14">
          <Reveal className="space-y-6 text-center lg:text-left">
            <Badge
              variant="secondary"
              className="mx-auto w-fit gap-2 border border-secondary/20 bg-secondary-soft/80 px-4 py-2 text-foreground shadow-sm lg:mx-0"
            >
              <Sparkles className="size-3.5" aria-hidden="true" />
              Acompañamiento emocional para estudiantes<span className="hidden sm:inline"> en Colombia</span>
            </Badge>

            <div className="space-y-5">
              <h1 className="mx-auto max-w-[11ch] text-4xl font-black leading-[0.98] tracking-[-0.04em] sm:text-5xl md:text-6xl lg:mx-0 lg:max-w-[10.5ch] lg:text-[4.9rem] xl:text-[5.6rem]">
                Habla, respira y organiza lo que te abruma
              </h1>
              <p className="mx-auto max-w-xl text-base leading-8 text-muted-foreground md:text-lg lg:mx-0">
                Desahógate U 2.0 reúne chat de acompañamiento, respiración 4-7-8, meditación guiada y tareas priorizadas para que recuperes claridad entre clases, entregas y parciales.
              </p>
            </div>

            <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/login">
                  Empezar gratis <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <a href="#features">Descubrir la experiencia</a>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={120} className="relative">
            <div className="glass-panel relative overflow-hidden rounded-[2.6rem] border border-border/60 p-5 shadow-soft transition-all duration-500 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6 md:p-8">
              <div className="ambient-grid absolute inset-0 opacity-55" />
              <div className="hero-image-wash absolute inset-0" />
              <div className="absolute left-[8%] top-[12%] h-28 w-28 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute bottom-[14%] right-[10%] h-36 w-36 rounded-full bg-accent/12 blur-3xl" />

              <div className="relative z-10 flex min-h-[24rem] flex-col justify-between gap-6 md:min-h-[30rem]">
                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[2rem] border border-border/60 bg-background/78 p-5 shadow-sm backdrop-blur sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">
                      Del desahogo a la acción
                    </p>
                    <p className="mt-4 text-2xl font-black tracking-tight text-foreground md:text-3xl">
                      Primero te escucha. Luego te ayuda a bajar la intensidad y elegir el siguiente paso.
                    </p>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                      No es solo un chat: también tienes herramientas concretas para respirar, meditar y transformar lo que sientes en tareas manejables.
                    </p>
                  </div>

                  <div className="rounded-[2rem] border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-full bg-primary-soft text-primary">
                        <CheckCircle2 className="size-5" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-black">Hoy puedo empezar por</p>
                        <p className="text-xs text-muted-foreground">3 minutos de claridad</p>
                      </div>
                    </div>
                    <div className="mt-5 space-y-3">
                      {supportFlow.map((item) => (
                        <div key={item.title} className="rounded-[1.35rem] border border-border/50 bg-background/65 p-3">
                          <div className="flex items-center gap-3">
                            <item.icon className="size-4 text-primary" aria-hidden="true" />
                            <p className="text-sm font-black">{item.title}</p>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {heroStats.map((item, index) => (
                    <Reveal
                      key={item.value}
                      delay={180 + index * 100}
                      className="rounded-[1.75rem] border border-border/60 bg-card/78 p-4 shadow-sm backdrop-blur transition-all duration-500 ease-out hover:-translate-y-0.5 hover:bg-card/88"
                    >
                      <p className="text-2xl font-black text-foreground">{item.value}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.label}</p>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
