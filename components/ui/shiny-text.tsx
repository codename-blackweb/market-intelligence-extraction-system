"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ShinyTextProps {
  children: React.ReactNode;
  disabled?: boolean;
  speed?: number;
  className?: string;
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  weight?: "normal" | "medium" | "semibold" | "bold" | "extrabold";
  baseColor?: string;
  shineColor?: string;
  intensity?: number;
  direction?: "left-to-right" | "right-to-left" | "top-to-bottom" | "bottom-to-top";
  shineWidth?: number;
  delay?: number;
  repeat?: number | "infinite";
  pauseOnHover?: boolean;
  gradientType?: "linear" | "radial";
}

const sizeClasses = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl"
} as const;

const weightClasses = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
  extrabold: "font-extrabold"
} as const;

const directionConfig = {
  "left-to-right": {
    backgroundPosition: ["100% 0%", "-100% 0%"],
    backgroundSize: "200% 100%"
  },
  "right-to-left": {
    backgroundPosition: ["-100% 0%", "100% 0%"],
    backgroundSize: "200% 100%"
  },
  "top-to-bottom": {
    backgroundPosition: ["0% 100%", "0% -100%"],
    backgroundSize: "100% 200%"
  },
  "bottom-to-top": {
    backgroundPosition: ["0% -100%", "0% 100%"],
    backgroundSize: "100% 200%"
  }
} as const;

export function ShinyText({
  children,
  disabled = false,
  speed = 3,
  className,
  size = "base",
  weight = "medium",
  baseColor,
  shineColor,
  intensity = 1,
  direction = "left-to-right",
  shineWidth = 0,
  delay = 0,
  repeat = "infinite",
  pauseOnHover = false,
  gradientType = "linear"
}: ShinyTextProps) {
  const config = directionConfig[direction];

  const gradientDirection =
    direction === "left-to-right" || direction === "right-to-left"
      ? "90deg"
      : direction === "top-to-bottom"
        ? "180deg"
        : "0deg";

  const defaultBaseColor = "rgba(255, 255, 255, 0.4)";
  const defaultShineColor = "rgba(255, 255, 255, 0.9)";

  const finalBaseColor = baseColor || defaultBaseColor;
  const finalShineColor = shineColor || defaultShineColor;

  const createGradient = () => {
    const transparentStartPos = Math.max(0, 50 - shineWidth / 2);
    const transparentEndPos = Math.min(100, 50 + shineWidth / 2);

    const shineStart = `${finalShineColor} ${transparentStartPos}%`;
    const shineEnd = `${finalShineColor} ${transparentEndPos}%`;

    return gradientType === "linear"
      ? `linear-gradient(${gradientDirection}, ${finalBaseColor}, transparent ${transparentStartPos - 5}%, ${shineStart}, ${shineEnd}, transparent ${transparentEndPos + 5}%, ${finalBaseColor})`
      : `radial-gradient(ellipse at center, ${finalShineColor} ${intensity * 100}%, transparent)`;
  };

  const animationVariants: Variants = {
    initial: {
      backgroundPosition: config.backgroundPosition[0]
    },
    animate: disabled
      ? {
          backgroundPosition: config.backgroundPosition[0],
          transition: {
            duration: 0,
            delay: 0,
            repeat: 0,
            ease: "linear"
          }
        }
      : {
          backgroundPosition: config.backgroundPosition[1],
          transition: {
            duration: speed,
            delay,
            repeat: typeof repeat === "number" ? repeat : Infinity,
            ease: "linear"
          }
        },
    hover: pauseOnHover ? {} : {}
  };

  if (disabled) {
    return (
      <span
        className={cn(
          "inline-block",
          sizeClasses[size],
          weightClasses[weight],
          "text-foreground",
          className
        )}
      >
        {children}
      </span>
    );
  }

  return (
    <motion.span
      animate="animate"
      className={cn(
        "bg-clip-text text-transparent inline-block",
        sizeClasses[size],
        weightClasses[weight],
        className
      )}
      initial="initial"
      style={{
        backgroundImage: createGradient(),
        backgroundSize: config.backgroundSize,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        opacity: intensity
      }}
      variants={animationVariants}
      whileHover="hover"
    >
      {children}
    </motion.span>
  );
}

export default ShinyText;
