"use client";

import { useEffect, useState } from "react";

export type MotionPolicy = {
  prefersReducedMotion: boolean;
  isMobile: boolean;
  lowMemory: boolean;
  allowSmokeyCursor: boolean;
  maxOrbitCount: number;
  loaderSize: number;
  loaderDuration: number;
};

function resolveMotionPolicy(): MotionPolicy {
  if (typeof window === "undefined") {
    return {
      prefersReducedMotion: false,
      isMobile: false,
      lowMemory: false,
      allowSmokeyCursor: true,
      maxOrbitCount: 4,
      loaderSize: 220,
      loaderDuration: 2
    };
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile =
    window.matchMedia("(max-width: 820px)").matches ||
    window.matchMedia("(pointer: coarse)").matches;
  const deviceMemory = (
    navigator as Navigator & {
      deviceMemory?: number;
    }
  ).deviceMemory;
  const lowMemory = typeof deviceMemory === "number" ? deviceMemory <= 4 : false;

  return {
    prefersReducedMotion,
    isMobile,
    lowMemory,
    allowSmokeyCursor: !(prefersReducedMotion || isMobile || lowMemory),
    maxOrbitCount: isMobile ? 3 : 4,
    loaderSize: isMobile ? 180 : 220,
    loaderDuration: isMobile ? 1.2 : 2
  };
}

export function useMotionPolicy() {
  const [policy, setPolicy] = useState<MotionPolicy>(() => resolveMotionPolicy());

  useEffect(() => {
    const update = () => {
      setPolicy(resolveMotionPolicy());
    };

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    update();
    reducedMotionQuery.addEventListener?.("change", update);
    window.addEventListener("resize", update);

    return () => {
      reducedMotionQuery.removeEventListener?.("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return policy;
}
