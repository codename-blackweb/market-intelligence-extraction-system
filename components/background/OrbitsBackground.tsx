"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface OrbitsBackgroundProps {
  className?: string;
  children?: ReactNode;
  count?: number;
  color?: string;
  speed?: number;
  accentColors?: string[];
}

interface Orbit {
  radius: number;
  tiltX: number;
  tiltY: number;
  rotationSpeed: number;
  particles: { angle: number; size: number; color: string }[];
  opacity: number;
  lineWidth: number;
  color: string;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized;
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(expanded);

  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16)
      }
    : { r: 6, g: 182, b: 212 };
}

function useDarkMode() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const update = () => {
      const root = document.documentElement;
      setIsDark(root.classList.contains("dark") || root.dataset.theme === "dark");
    };

    update();

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"]
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
}

export function OrbitsBackground({
  className,
  children,
  count = 6,
  color = "#06b6d4",
  speed = 1,
  accentColors
}: OrbitsBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = useDarkMode();

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    const darkPalette = accentColors?.length
      ? accentColors
      : ["#ffffff", "#67e8f9", "#facc15", "#f87171", "#a3e635", color];
    const lightPalette = darkPalette.map((entry, index) =>
      entry.toLowerCase() === "#ffffff" || entry.toLowerCase() === "#fff"
        ? "#050505"
        : index === darkPalette.length - 1
          ? color
          : entry
    );
    const palette = isDark ? darkPalette : lightPalette;

    let width = 0;
    let height = 0;
    let animationId = 0;
    let orbits: Orbit[] = [];

    const configureCanvas = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const createOrbits = () => {
      const minDim = Math.min(width, height);
      const next: Orbit[] = [];

      for (let i = 0; i < count; i += 1) {
        const orbitColor = palette[i % palette.length] ?? color;
        const particleCount = 1 + Math.floor(Math.random() * 2);

        next.push({
          radius: minDim * (0.17 + (i / Math.max(count, 1)) * 0.56),
          tiltX: 0.36 + Math.random() * 0.42,
          tiltY: Math.random() * 0.5,
          rotationSpeed:
            (0.0022 + Math.random() * 0.0035) * (Math.random() > 0.5 ? 1 : -1) * speed,
          particles: Array.from({ length: particleCount }, () => ({
            angle: Math.random() * Math.PI * 2,
            size: 2.5 + Math.random() * 2.5,
            color: orbitColor
          })),
          opacity: 0.14 + (i / Math.max(count, 1)) * (isDark ? 0.22 : 0.14),
          lineWidth: 0.75 + (i / Math.max(count, 1)) * 1.25,
          color: orbitColor
        });
      }

      return next;
    };

    const handleResize = () => {
      configureCanvas();
      orbits = createOrbits();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    const cx = () => width / 2;
    const cy = () => height / 2;

    const drawOrbit = (orbit: Orbit) => {
      const rgb = hexToRgb(orbit.color);
      ctx.beginPath();
      ctx.ellipse(cx(), cy(), orbit.radius, orbit.radius * orbit.tiltX, orbit.tiltY, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${orbit.opacity})`;
      ctx.lineWidth = orbit.lineWidth;
      ctx.stroke();
    };

    const drawParticle = (orbit: Orbit, particle: { angle: number; size: number; color: string }) => {
      const rgb = hexToRgb(particle.color);
      const x =
        cx() +
        Math.cos(particle.angle) * orbit.radius * Math.cos(orbit.tiltY) -
        Math.sin(particle.angle) * orbit.radius * orbit.tiltX * Math.sin(orbit.tiltY);
      const y =
        cy() +
        Math.cos(particle.angle) * orbit.radius * Math.sin(orbit.tiltY) +
        Math.sin(particle.angle) * orbit.radius * orbit.tiltX * Math.cos(orbit.tiltY);

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, particle.size * 8);
      gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.88)`);
      gradient.addColorStop(0.28, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.32)`);
      gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, particle.size * 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isDark ? "#ffffff" : "#050505";
      ctx.beginPath();
      ctx.arc(x, y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    };

    const animate = () => {
      ctx.fillStyle = isDark ? "#030712" : "#f8fafc";
      ctx.fillRect(0, 0, width, height);

      const centerGradient = ctx.createRadialGradient(cx(), cy(), 0, cx(), cy(), Math.min(width, height) * 0.16);
      const centerRgb = hexToRgb(palette[1] ?? color);
      centerGradient.addColorStop(0, `rgba(${centerRgb.r}, ${centerRgb.g}, ${centerRgb.b}, ${isDark ? 0.26 : 0.14})`);
      centerGradient.addColorStop(0.45, `rgba(${centerRgb.r}, ${centerRgb.g}, ${centerRgb.b}, ${isDark ? 0.1 : 0.05})`);
      centerGradient.addColorStop(1, "transparent");
      ctx.fillStyle = centerGradient;
      ctx.beginPath();
      ctx.arc(cx(), cy(), Math.min(width, height) * 0.16, 0, Math.PI * 2);
      ctx.fill();

      for (const orbit of orbits) {
        drawOrbit(orbit);

        for (const particle of orbit.particles) {
          particle.angle += orbit.rotationSpeed;
          drawParticle(orbit, particle);
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    handleResize();
    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, [accentColors, color, count, isDark, speed]);

  return (
    <div
      ref={containerRef}
      className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: isDark
            ? "radial-gradient(ellipse at center, transparent 0%, transparent 52%, #030712 100%)"
            : "radial-gradient(ellipse at center, transparent 0%, transparent 55%, #f8fafc 100%)"
        }}
      />
      {children ? <div className="relative z-10 h-full w-full">{children}</div> : null}
    </div>
  );
}

export default OrbitsBackground;
