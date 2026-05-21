import { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/marketing/HeroSection";
import { CRISIS_DISCLAIMER } from "@/lib/constants";

const FeaturesSection = lazy(() => import("@/components/marketing/FeaturesSection").then((module) => ({ default: module.FeaturesSection })));
const ShowcaseSection = lazy(() => import("@/components/marketing/ShowcaseSection").then((module) => ({ default: module.ShowcaseSection })));
const HowItWorksSection = lazy(() => import("@/components/marketing/HowItWorksSection").then((module) => ({ default: module.HowItWorksSection })));
const MicroactionsSection = lazy(() => import("@/components/marketing/MicroactionsSection").then((module) => ({ default: module.MicroactionsSection })));
const PricingSection = lazy(() => import("@/components/marketing/PricingSection").then((module) => ({ default: module.PricingSection })));
const TestimonialsSection = lazy(() => import("@/components/marketing/TestimonialsSection").then((module) => ({ default: module.TestimonialsSection })));
const CtaSection = lazy(() => import("@/components/marketing/CtaSection").then((module) => ({ default: module.CtaSection })));

const navLinks = [
  { href: "#features", label: "Beneficios" },
  { href: "#experiencia", label: "Experiencia" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#microacciones", label: "Herramientas" },
  { href: "#pricing", label: "Planes" },
];

function SectionFallback() {
  return <div className="container h-28 animate-pulse rounded-[2rem] bg-card/45" />;
}

export function LandingPage() {
  return (
    <div className="product-ambient-bg min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-2xl">
        <div className="container flex flex-col gap-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Logo />
            <ThemeToggle className="lg:hidden" />
          </div>

          <nav
            aria-label="Navegación principal"
            className="hidden items-center gap-1 rounded-full border border-border/60 bg-card/55 p-1 text-sm font-semibold text-muted-foreground shadow-sm backdrop-blur lg:flex"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-2 transition-colors hover:bg-primary-soft/55 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle className="hidden lg:inline-flex" />
            <Button asChild className="w-full sm:w-auto">
              <Link to="/login">Empezar gratis</Link>
            </Button>
          </div>
        </div>
      </header>
      <main>
        <HeroSection />
        <Suspense fallback={<SectionFallback />}>
          <FeaturesSection />
          <ShowcaseSection />
          <HowItWorksSection />
          <MicroactionsSection />
          <PricingSection />
          <TestimonialsSection />
          <CtaSection />
        </Suspense>
      </main>
      <footer className="container flex flex-col gap-4 border-t border-border/60 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <Logo />
        <p>{CRISIS_DISCLAIMER}</p>
      </footer>
    </div>
  );
}
