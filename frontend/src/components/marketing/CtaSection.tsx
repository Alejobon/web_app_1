import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="container py-16 md:py-20">
      <div className="relative overflow-hidden rounded-[2.25rem] border border-primary/20 bg-gradient-to-br from-primary via-secondary to-accent p-8 text-primary-foreground shadow-soft md:p-12">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-background/25 blur-2xl" />
        <div className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-secondary/40 blur-3xl" />
        <Sparkles className="relative size-8" />
        <h2 className="relative mt-5 max-w-2xl text-3xl font-black tracking-tight text-white sm:text-4xl">
          Un paso a la vez. No tenés que sostenerlo todo solo.
        </h2>
        <p className="relative mt-4 max-w-xl text-sm leading-7 text-white/85 sm:text-base">
          Entrá, escribí lo que estás viviendo y usá las herramientas que ya existen para recuperar un poco de aire y claridad.
        </p>
        <Button asChild size="lg" variant="secondary" className="relative mt-8">
          <Link to="/login">
            Empezar gratis <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
