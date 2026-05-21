import { Heart, Leaf, Sparkles } from "lucide-react";

const decorations = [
  { Icon: Sparkles, top: "8%", left: "6%", size: "h-5 w-5", color: "text-yellow-400/40", rotate: "rotate-12" },
  { Icon: Heart, top: "18%", right: "8%", size: "h-4 w-4", color: "text-rose-400/35", rotate: "-rotate-6" },
  { Icon: Leaf, top: "65%", left: "4%", size: "h-5 w-5", color: "text-emerald-400/30", rotate: "rotate-45" },
  { Icon: Sparkles, top: "72%", right: "5%", size: "h-4 w-4", color: "text-sky-400/35", rotate: "-rotate-12" },
  { Icon: Heart, top: "40%", left: "3%", size: "h-3 w-3", color: "text-pink-400/30", rotate: "rotate-12" },
  { Icon: Leaf, top: "85%", right: "10%", size: "h-4 w-4", color: "text-lime-400/25", rotate: "-rotate-45" },
  { Icon: Sparkles, top: "50%", left: "8%", size: "h-3 w-3", color: "text-amber-400/30", rotate: "rotate-6" },
  { Icon: Heart, top: "30%", right: "4%", size: "h-3 w-3", color: "text-rose-300/30", rotate: "-rotate-12" },
];

export function ChatDecorations() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {decorations.map((d, i) => {
        const Icon = d.Icon;
        const style: React.CSSProperties = {
          position: "absolute",
          top: d.top,
          ...(d.left !== undefined ? { left: d.left } : {}),
          ...(d.right !== undefined ? { right: d.right } : {}),
        };
        return (
          <Icon
            key={i}
            className={`absolute ${d.size} ${d.color} ${d.rotate} animate-float`}
            style={style}
          />
        );
      })}
    </div>
  );
}
