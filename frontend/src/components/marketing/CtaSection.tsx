import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="container py-16 md:py-20">
      <div className="relative overflow-hidden rounded-[2.25rem] border border-primary/20 bg-gradient-to-br from-primary via-secondary to-accent p-8 text-primary-foreground shadow-soft md:p-12">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-background/25 blur-2xl" />
        <div className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-secondary/40 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div>
            <Sparkles className="size-8" aria-hidden="true" />
            <h2 className="mt-5 max-w-2xl text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
              Un paso a la vez. No tienes que sostenerlo todo solo.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/85 sm:text-base">
              Entra, escribe lo que estás viviendo y usa herramientas concretas para recuperar aire, foco y claridad.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-8">
              <Link to="/login">
                Empezar gratis <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div className="rounded-[2rem] border border-white/25 bg-white/14 p-5 text-white shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              Empieza por algo pequeño
            </p>
            <p className="mt-4 text-2xl font-black tracking-tight">
              Escribir una frase, respirar un ciclo, crear una tarea.
            </p>
            <p className="mt-3 text-sm leading-6 text-white/80">
              La meta no es resolverlo todo hoy: es recuperar suficiente claridad para avanzar con cuidado.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
