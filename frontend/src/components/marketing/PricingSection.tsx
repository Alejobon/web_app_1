import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const tiers = [
  {
    name: "Gratis",
    price: "$0",
    period: "/mes",
    description: "Para empezar hoy con acompañamiento, pausa y primeros pasos más claros.",
    features: [
      "Chat de acompañamiento",
      "Respiración 4-7-8",
      "Meditación guiada",
      "Primeras herramientas para ordenar tareas",
    ],
    cta: "Empezar gratis",
    href: "/login",
    highlighted: false,
  },
  {
    name: "Plus Estudiante",
    price: "Pronto",
    period: "",
    description: "Más profundidad y seguimiento para estudiantes que quieran sostener el proceso con más apoyo.",
    features: [
      "Tracking emocional",
      "Historial más completo",
      "Experiencias guiadas ampliadas",
      "Recordatorios y continuidad",
    ],
    cta: "Próximamente",
    href: "/login",
    highlighted: true,
    soon: true,
  },
  {
    name: "Premium Universitario",
    price: "Pronto",
    period: "",
    description: "Una oferta más robusta pensada para ampliar el acompañamiento y sumar herramientas futuras.",
    features: [
      "Todo lo de Plus Estudiante",
      "Herramientas avanzadas",
      "Más personalización",
      "Nuevas dinámicas por habilitar",
    ],
    cta: "Próximamente",
    href: "/login",
    highlighted: false,
    soon: true,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="container py-16 md:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-black text-primary">Planes</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          Empezá gratis y conocé lo que viene
        </h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
          El plan gratuito ya está listo para usar, y los planes Plus Estudiante y Premium Universitario quedan visibles como ofertas próximas.
        </p>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {tiers.map((tier) => (
          <Card
            key={tier.name}
            className={
              tier.highlighted
                ? "relative overflow-hidden border-primary/40 bg-primary-soft/45 shadow-soft"
                : "relative overflow-hidden border-border/60 bg-card/85 shadow-sm backdrop-blur"
            }
          >
            {tier.soon && (
              <div className="absolute right-4 top-4 rounded-full border border-primary/20 bg-card/80 px-3 py-1 text-xs font-black text-primary shadow-sm backdrop-blur">
                Próximamente
              </div>
            )}
            <CardContent className="flex flex-col p-6">
              <h3 className="text-xl font-black">{tier.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-black">{tier.price}</span>
                <span className="text-sm text-muted-foreground">{tier.period}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {tier.description}
              </p>
              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full" variant={tier.highlighted ? "default" : "outline"}>
                <Link
                  to={tier.href}
                  aria-disabled={tier.soon ? "true" : undefined}
                  className={tier.soon ? "pointer-events-none" : undefined}
                >
                  {tier.cta}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
