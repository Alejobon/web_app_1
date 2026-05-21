// Logo — renders the app logo image with text fallback.
import { cn } from "@/lib/cn";
import logoImg from "@/assets/images/logo.png";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img
        src={logoImg}
        alt="Desahógate U 2.0"
        className="h-12 w-12 rounded-3xl object-cover shadow-soft"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
      {!compact && (
        <div>
          <p className="text-base font-black leading-none tracking-tight">Desahógate U</p>
          <p className="text-xs font-bold text-primary">2.0</p>
        </div>
      )}
    </div>
  );
}
