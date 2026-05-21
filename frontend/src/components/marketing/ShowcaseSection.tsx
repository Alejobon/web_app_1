import loginImg from "@/assets/images/login.png";
import fondoLoginImg from "@/assets/images/Fondo_Login.png";
import { Reveal } from "@/components/marketing/Reveal";

export function ShowcaseSection() {
  return (
    <section className="container py-16 md:py-24">
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="font-black text-primary">Experiencia</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
          Un entorno visual sereno para acompañar sin distraer
        </h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base md:text-lg">
          Desde el acceso hasta los espacios de pausa, la interfaz busca sostener el momento sin agregar más ruido.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Reveal>
          <article className="glass-panel group overflow-hidden rounded-[2.5rem] border border-border/60 p-4 shadow-soft transition-all duration-500 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:p-5">
            <div className="overflow-hidden rounded-[2rem]">
              <img
                src={fondoLoginImg}
                alt="Ambientación visual serena de Desahógate"
                className="h-[20rem] w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02] md:h-[28rem]"
              />
            </div>
            <div className="px-2 pb-2 pt-5 md:px-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">
                Atmósfera
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                La meditación usa una ambientación más calma para ayudarte a bajar revoluciones y sostener la atención.
              </p>
            </div>
          </article>
        </Reveal>

        <Reveal delay={120}>
          <article className="glass-panel group flex h-full flex-col overflow-hidden rounded-[2.5rem] border border-border/60 p-4 shadow-soft transition-all duration-500 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:p-5">
            <div className="overflow-hidden rounded-[2rem]">
              <img
                src={loginImg}
                alt="Vista del acceso a la plataforma"
                className="h-[20rem] w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.02] md:h-[28rem]"
              />
            </div>
            <div className="px-2 pb-2 pt-5 md:px-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">
                Acceso
              </p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
                El acceso mantiene la identidad del producto y te lleva rápido al espacio donde empezás a usarlo.
              </p>
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  );
}
