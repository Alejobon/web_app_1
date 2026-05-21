import { Reveal } from "@/components/marketing/Reveal";

const steps = [
  {
    number: "01",
    title: "Desahogarte",
    text: "Entrás al chat y escribís lo que te pasa sin necesidad de tenerlo ordenado desde el inicio.",
  },
  {
    number: "02",
    title: "Regularte",
    text: "Si necesitás bajar la intensidad, usás respiración 4-7-8 o una meditación guiada adaptada a tu momento.",
  },
  {
    number: "03",
    title: "Ordenarte",
    text: "Cuando ya hay más claridad, transformás lo importante en tareas pequeñas, concretas y priorizadas.",
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
              El producto no se queda en la contención: te ayuda a pasar de lo que sentís a algo más respirable y accionable.
            </p>
          </div>

          <div className="mx-auto max-w-4xl space-y-5">
            {steps.map((step, index) => (
              <Reveal key={step.number} delay={index * 120}>
                <article className="glass-panel rounded-[2.3rem] border border-border/60 p-6 shadow-soft md:p-8">
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <span className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">
                      {step.number}
                    </span>
                    <div className="max-w-2xl">
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
