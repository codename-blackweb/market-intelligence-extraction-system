"use client";

import { cn } from "../lib/utils";
import React, { type ReactNode, useEffect, useState } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

export interface VideoTextProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  preload?: "auto" | "metadata" | "none";
  children: ReactNode;
  fontSize?: string | number;
  fontWeight?: string | number;
  textAnchor?: string;
  textX?: string;
  dominantBaseline?: string;
  fontFamily?: string;
  fontStyle?: string;
  maskPosition?: string;
  maskSize?: string;
  maskText?: string;
  as?: "div" | "span" | "section" | "article" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export interface VideoSurfaceProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  preload?: "auto" | "metadata" | "none";
  children?: ReactNode;
  overlayClassName?: string;
  as?: "div" | "span" | "section" | "article" | "p";
}

export function VideoText({
  src,
  children,
  className = "",
  autoPlay = true,
  muted = true,
  loop = true,
  preload = "auto",
  fontSize = 20,
  fontWeight = "bold",
  textAnchor = "middle",
  textX = "50%",
  dominantBaseline = "middle",
  fontFamily = "sans-serif",
  fontStyle = "normal",
  maskPosition = "center",
  maskSize = "contain",
  maskText,
  as = "div",
  ...motionProps
}: VideoTextProps & HTMLMotionProps<"div">) {
  const [svgMask, setSvgMask] = useState("");
  const content = maskText ?? React.Children.toArray(children).join("");

  useEffect(() => {
    const responsiveFontSize = typeof fontSize === "number" ? `${fontSize}vw` : fontSize;
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const escapeXml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

    const lineMarkup =
      lines.length > 1
        ? lines
            .map((line, index) => {
              const dy = index === 0 ? `${-0.6 * (lines.length - 1)}em` : "1.2em";
              return `<tspan x='${textX}' dy='${dy}'>${escapeXml(line)}</tspan>`;
            })
            .join("")
        : escapeXml(content);

    const newSvgMask = `<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'>
      <text x='${textX}' y='50%'
            font-size='${responsiveFontSize}'
            font-weight='${fontWeight}'
            text-anchor='${textAnchor}'
            dominant-baseline='${dominantBaseline}'
            font-family='${fontFamily}'
            font-style='${fontStyle}'
            fill='black'>${lineMarkup}</text>
    </svg>`;
    setSvgMask(newSvgMask);
  }, [content, fontSize, fontWeight, textAnchor, textX, dominantBaseline, fontFamily, fontStyle]);

  const validTags = ["div", "span", "section", "article", "p", "h1", "h2", "h3", "h4", "h5", "h6"] as const;

  const MotionComponent = motion[validTags.includes(as) ? as : "div"] as React.ElementType;

  if (!svgMask) {
    return (
      <MotionComponent className={cn("relative size-full", className)} {...motionProps}>
        <span className="sr-only">{content}</span>
      </MotionComponent>
    );
  }

  const dataUrlMask = `url("data:image/svg+xml,${encodeURIComponent(svgMask)}")`;

  return (
    <MotionComponent className={cn("relative overflow-hidden", className)} {...motionProps}>
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          maskImage: dataUrlMask,
          WebkitMaskImage: dataUrlMask,
          maskSize,
          WebkitMaskSize: maskSize,
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition,
          WebkitMaskPosition: maskPosition,
          opacity: 1,
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
          willChange: "transform"
        }}
      >
        <video
          className="w-full h-full object-cover"
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          preload={preload}
          playsInline
          style={{
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
            willChange: "transform"
          }}
        >
          <source src={src} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      <span className="sr-only">{content}</span>
    </MotionComponent>
  );
}

export function VideoSurface({
  src,
  className = "",
  autoPlay = true,
  muted = true,
  loop = true,
  preload = "auto",
  children,
  overlayClassName = "",
  as = "div",
  ...motionProps
}: VideoSurfaceProps & HTMLMotionProps<"div">) {
  const validTags = ["div", "span", "section", "article", "p"] as const;
  const MotionComponent = motion[validTags.includes(as) ? as : "div"] as React.ElementType;

  return (
    <MotionComponent className={cn("relative overflow-hidden", className)} {...motionProps}>
      <video
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        preload={preload}
        playsInline
        style={{
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
          willChange: "transform"
        }}
      >
        <source src={src} type="video/mp4" />
      </video>
      <span className={cn("absolute inset-0", overlayClassName)} aria-hidden="true" />
      {children ? (
        <span
          className="flex h-full w-full items-center justify-center"
          style={{ position: "relative", zIndex: 1 }}
        >
          {children}
        </span>
      ) : null}
    </MotionComponent>
  );
}

export default VideoText;
