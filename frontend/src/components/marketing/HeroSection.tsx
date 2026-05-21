import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Reveal } from "@/components/marketing/Reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const heroStats = [
  { value: "Chat IA", label: "Escribí libremente y empezá a ordenar lo que te pasa." },
  { value: "4-7-8", label: "Respiración guiada para bajar la intensidad del momento." },
  { value: "Tareas", label: "Convertí lo que te abruma en pasos concretos y posibles." },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pb-12 pt-12 md:pb-20 md:pt-24">
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/10 via-secondary/6 to-transparent" />
      <div className="animate-drift absolute left-[-12%] top-28 h-80 w-80 wave-yellow opacity-70" />
      <div className="animate-float-slow absolute bottom-[-8rem] right-[-12%] h-[28rem] w-[34rem] wave-blue opacity-80" />

      <div className="container relative space-y-12 md:space-y-16">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
          <Reveal className="space-y-6 text-center lg:text-left">
            <Badge
              variant="secondary"
              className="mx-auto w-fit gap-2 border border-secondary/20 bg-secondary-soft/80 px-4 py-2 text-foreground shadow-sm lg:mx-0"
            >
              <Sparkles className="size-3.5" />
              Acompañamiento emocional para estudiantes
            </Badge>

            <div className="space-y-5">
              <h1 className="mx-auto max-w-[11ch] text-4xl font-black leading-[0.98] tracking-[-0.04em] sm:text-5xl md:text-6xl lg:mx-0 lg:text-[4.8rem] xl:text-[5.5rem]">
                Hablar, respirar y ordenar lo que te abruma
              </h1>
              <p className="mx-auto max-w-xl text-base leading-8 text-muted-foreground md:text-lg lg:mx-0">
                Desahógate U 2.0 reúne un chat de acompañamiento, respiración 4-7-8, meditación guiada y tareas priorizadas para ayudarte a recuperar claridad paso a paso.
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
            <div className="glass-panel relative overflow-hidden rounded-[2.6rem] border border-border/60 p-6 shadow-soft transition-all duration-500 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:p-8">
              <div className="ambient-grid absolute inset-0 opacity-55" />
              <div className="hero-image-wash absolute inset-0" />
              <div className="absolute left-[8%] top-[12%] h-28 w-28 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute bottom-[14%] right-[10%] h-36 w-36 rounded-full bg-accent/12 blur-3xl" />

              <div className="relative z-10 flex min-h-[24rem] flex-col justify-between gap-6 md:min-h-[28rem]">
                <div className="max-w-lg rounded-[2rem] border border-border/60 bg-background/74 p-6 shadow-sm backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">
                    Del desahogo a la acción
                  </p>
                  <p className="mt-4 text-2xl font-black tracking-tight text-foreground md:text-3xl">
                    Primero te escuchamos. Después te ayudamos a bajar la intensidad y a dar el siguiente paso.
                  </p>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    No es solo un chat: también tenés herramientas concretas para respirar, meditar y transformar lo que sentís en tareas manejables.
                  </p>
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
