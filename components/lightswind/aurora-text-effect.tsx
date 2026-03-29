import React from "react";
import { cn } from "../utils";

export interface AuroraTextEffectProps {
  text: string;
  className?: string;
  textClassName?: string;
  fontSize?: string;
  colors?: {
    first?: string;
    second?: string;
    third?: string;
    fourth?: string;
  };
  blurAmount?:
    | "blur-none"
    | "blur-sm"
    | "blur-md"
    | "blur-lg"
    | "blur-xl"
    | "blur-2xl"
    | "blur-3xl"
    | string;
  animationSpeed?: {
    border?: number;
    first?: number;
    second?: number;
    third?: number;
    fourth?: number;
  };
}

export function AuroraTextEffect({
  text,
  className,
  textClassName,
  fontSize = "clamp(3rem, 8vw, 7rem)",
  colors = {
    first: "bg-cyan-400",
    second: "bg-yellow-400",
    third: "bg-green-400",
    fourth: "bg-purple-500",
  },
  blurAmount = "blur-lg",
  animationSpeed = {
    border: 6,
    first: 5,
    second: 5,
    third: 3,
    fourth: 13,
  },
}: AuroraTextEffectProps) {
  const lines = text.split("\n");

  const resolveColor = (value: string | undefined, fallback: string) => {
    if (!value) {
      return fallback;
    }

    if (value.startsWith("#") || value.startsWith("rgb") || value.startsWith("hsl")) {
      return value;
    }

    const tailwindMap: Record<string, string> = {
      "bg-cyan-400": "#22d3ee",
      "bg-yellow-400": "#facc15",
      "bg-green-400": "#4ade80",
      "bg-purple-500": "#a855f7",
      "bg-blue-400": "#60a5fa",
      "bg-emerald-400": "#34d399",
      "bg-rose-400": "#fb7185"
    };

    return tailwindMap[value] ?? fallback;
  };

  const gradientColors = [
    resolveColor(colors.first, "#7dd3fc"),
    resolveColor(colors.second, "#fde047"),
    resolveColor(colors.third, "#86efac"),
    resolveColor(colors.fourth, "#c084fc")
  ];
  const auroraDuration = Math.max(
    animationSpeed.first ?? 5,
    animationSpeed.second ?? 5,
    animationSpeed.third ?? 5,
    animationSpeed.fourth ?? 5
  );

  const keyframes = `
    @keyframes aurora-pan {
      0%, 100% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
    }
  `;

  const gradientStyle = {
    backgroundImage: `linear-gradient(120deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 28%, ${gradientColors[2]} 62%, ${gradientColors[3]} 100%)`,
    backgroundSize: "220% 220%",
    WebkitBackgroundClip: "text" as const,
    backgroundClip: "text" as const,
    color: "transparent",
    animation: `aurora-pan ${auroraDuration}s ease-in-out infinite`
  };

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center overflow-hidden bg-transparent",
        className
      )}
    >
      <style>{keyframes}</style>
      <div className="w-full text-center">
        <h2
          className={cn(
            "relative w-full overflow-hidden font-extrabold tracking-tight",
            textClassName
          )}
          style={{ fontSize }}
        >
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 opacity-35",
              blurAmount === "blur-none" ? "" : blurAmount
            )}
          >
            {lines.map((line, index) => (
              <span key={`glow-${index}`} className="block" style={gradientStyle}>
                {line}
              </span>
            ))}
          </span>
          <span className="relative block">
            {lines.map((line, index) => (
              <span key={index} className="block" style={gradientStyle}>
                {line}
              </span>
            ))}
          </span>
        </h2>
      </div>
    </div>
  );
}

export default AuroraTextEffect;
