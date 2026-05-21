import { Reveal } from "@/components/marketing/Reveal";

const steps = [
  {
    number: "01",
    title: "Desahogarte",
    text: "Entras al chat y escribes lo que te pasa sin necesidad de tenerlo ordenado desde el inicio.",
  },
  {
    number: "02",
    title: "Regularte",
    text: "Si necesitas bajar la intensidad, usas respiración 4-7-8 o una meditación guiada adaptada a tu momento.",
  },
  {
    number: "03",
    title: "Ordenarte",
    text: "Cuando hay más claridad, conviertes lo importante en tareas pequeñas, concretas y priorizadas.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="relative overflow-hidden py-16 md:py-24">
      <div className="absolute inset-x-0 bottom-0 h-52 wave-blue opacity-60" />
      <div className="container relative">
        <Reveal className="space-y-10">
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <p className="font-black text-primary">Cómo funciona</p>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
              Un flujo simple para acompañarte de verdad
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base md:text-lg">
              El producto no se queda en la contención: te ayuda a pasar de lo que sientes a algo más respirable y accionable.
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3">
            {steps.map((step, index) => (
              <Reveal key={step.number} delay={index * 120} className="h-full">
                <article className="glass-panel h-full rounded-[2.3rem] border border-border/60 p-6 shadow-soft md:p-8 lg:min-h-[19rem]">
                  <div className="flex h-full flex-col gap-8">
                    <span className="w-fit rounded-full border border-primary/20 bg-primary-soft/55 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-primary/80">
                      {step.number}
                    </span>
                    <div className="mt-auto">
                      <h3 className="text-2xl font-black tracking-tight md:text-3xl">{step.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
                        {step.text}
                      </p>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
