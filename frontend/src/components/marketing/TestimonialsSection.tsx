import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    quote:
      "Podés escribir como te salga. El producto está pensado para recibir primero lo que sentís y recién después ayudarte a ordenarlo.",
    name: "Entrada libre",
    role: "Chat + organización",
  },
  {
    quote:
      "Respiración 4-7-8 y meditación guiada existen como herramientas separadas para cuando necesitás una pausa concreta, no solo más texto.",
    name: "Pausas guiadas",
    role: "Respiración + meditación",
  },
  {
    quote:
      "Desahógate no reemplaza ayuda profesional. Si estás en peligro o en crisis, necesitás apoyo inmediato de personas o servicios capacitados.",
    name: "Uso responsable",
    role: "Aviso importante",
  },
];

export function TestimonialsSection() {
  return (
    <section className="container py-16 md:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-black text-primary">Antes de entrar</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          Tres cosas importantes sobre el producto
        </h2>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {testimonials.map((t) => (
          <Card key={t.name} className="border-border/60 bg-card/85 shadow-sm backdrop-blur">
            <CardContent className="p-6">
              <div className="mb-5 h-2 w-16 rounded-full bg-primary" />
              <p className="text-sm leading-7 text-muted-foreground">
                “{t.quote}”
              </p>
              <p className="mt-4 font-black">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.role}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
