"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  px: number;
  py: number;
  color: string;
};

export type KineticFlowBgProps = {
  particleCount?: number;
  complexity?: number;
  flowSpeed?: number;
  trailOpacity?: number;
  particleColors?: string[];
  interactive?: boolean;
};

const DEFAULT_COLORS = ["#8be9fd", "#7dd3fc", "#c4b5fd", "#93c5fd", "#86efac"];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function KineticFlowBg({
  particleCount = 1200,
  complexity = 0.003,
  flowSpeed = 1.5,
  trailOpacity = 0.08,
  particleColors = DEFAULT_COLORS,
  interactive = true
}: KineticFlowBgProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false
  });

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d", { alpha: true });

    if (!context) {
      return;
    }

    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let particles: Particle[] = [];
    let lastTime = 0;

    const resetParticle = (particle?: Particle) => {
      const nextParticle = particle ?? {
        x: 0,
        y: 0,
        px: 0,
        py: 0,
        color: particleColors[Math.floor(Math.random() * particleColors.length)] ?? DEFAULT_COLORS[0]
      };

      nextParticle.x = randomBetween(0, width);
      nextParticle.y = randomBetween(0, height);
      nextParticle.px = nextParticle.x;
      nextParticle.py = nextParticle.y;
      nextParticle.color =
        particleColors[Math.floor(Math.random() * particleColors.length)] ?? DEFAULT_COLORS[0];

      return nextParticle;
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = Array.from({ length: particleCount }, () => resetParticle());
      context.fillStyle = "rgba(0, 0, 0, 1)";
      context.fillRect(0, 0, width, height);
    };

    const resolveAngle = (x: number, y: number, time: number) => {
      const field =
        Math.sin(x * complexity + time * 0.00012) +
        Math.cos(y * complexity * 1.21 - time * 0.00008) +
        Math.sin((x + y) * complexity * 0.7 + time * 0.00005);

      let pointerInfluence = 0;

      if (interactive && pointerRef.current.active) {
        const dx = pointerRef.current.x - x;
        const dy = pointerRef.current.y - y;
        const distance = Math.hypot(dx, dy) || 1;

        if (distance < 240) {
          pointerInfluence = Math.atan2(dy, dx) * ((240 - distance) / 240) * 0.28;
        }
      }

      return field * Math.PI + pointerInfluence;
    };

    const draw = (time: number) => {
      const delta = Math.min((time - lastTime) / 16.6667 || 1, 2);
      lastTime = time;

      context.fillStyle = `rgba(3, 6, 12, ${trailOpacity})`;
      context.fillRect(0, 0, width, height);
      context.lineWidth = 1.05;
      context.lineCap = "round";
      context.globalCompositeOperation = "screen";

      for (const particle of particles) {
        const angle = resolveAngle(particle.x, particle.y, time);
        const velocity = flowSpeed * delta;
        particle.px = particle.x;
        particle.py = particle.y;
        particle.x += Math.cos(angle) * velocity;
        particle.y += Math.sin(angle) * velocity;

        if (
          particle.x < -20 ||
          particle.x > width + 20 ||
          particle.y < -20 ||
          particle.y > height + 20
        ) {
          resetParticle(particle);
          continue;
        }

        context.strokeStyle = particle.color;
        context.beginPath();
        context.moveTo(particle.px, particle.py);
        context.lineTo(particle.x, particle.y);
        context.stroke();
      }

      animationFrame = window.requestAnimationFrame(draw);
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointerRef.current = {
        x: event.clientX,
        y: event.clientY,
        active: true
      };
    };

    const handlePointerLeave = () => {
      pointerRef.current.active = false;
    };

    resize();
    animationFrame = window.requestAnimationFrame(draw);

    window.addEventListener("resize", resize);

    if (interactive) {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      window.addEventListener("pointerdown", handlePointerMove, { passive: true });
      window.addEventListener("pointerleave", handlePointerLeave);
      window.addEventListener("blur", handlePointerLeave);
    }

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);

      if (interactive) {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerdown", handlePointerMove);
        window.removeEventListener("pointerleave", handlePointerLeave);
        window.removeEventListener("blur", handlePointerLeave);
      }
    };
  }, [complexity, flowSpeed, interactive, particleColors, particleCount, trailOpacity]);

  return (
    <canvas
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      ref={canvasRef}
    />
  );
}
