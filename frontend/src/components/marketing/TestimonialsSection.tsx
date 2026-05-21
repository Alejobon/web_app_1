import { ClipboardCheck, HeartHandshake, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const principles = [
  {
    icon: HeartHandshake,
    title: "Puedes escribir sin tener todo claro",
    text: "La experiencia está diseñada para recibir primero lo que sientes y ayudarte después a ordenarlo con calma.",
    label: "Entrada libre",
  },
  {
    icon: ClipboardCheck,
    title: "La pausa debe llevar a algo posible",
    text: "Respiración, meditación y tareas trabajan juntas para que el alivio no se quede solo en palabras.",
    label: "Acción gradual",
  },
  {
    icon: ShieldCheck,
    title: "No reemplaza ayuda profesional",
    text: "Si hay riesgo, crisis o peligro inmediato, busca apoyo de personas cercanas o servicios capacitados.",
    label: "Uso responsable",
  },
];

export function TestimonialsSection() {
  return (
    <section className="container py-16 md:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-black text-primary">Antes de entrar</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          Expectativas claras para usarlo bien
        </h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
          Esto no son testimonios inventados. Son principios de producto para que sepas qué esperar desde el inicio.
        </p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {principles.map((item) => (
          <Card key={item.title} className="border-border/60 bg-card/85 shadow-sm backdrop-blur">
            <CardContent className="flex h-full flex-col p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex size-12 items-center justify-center rounded-[1.4rem] bg-primary-soft text-primary">
                  <item.icon className="size-6" aria-hidden="true" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {item.label}
                </span>
              </div>
              <h3 className="mt-6 text-xl font-black tracking-tight">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {item.text}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
