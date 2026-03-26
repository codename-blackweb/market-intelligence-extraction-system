"use client";

import React from "react";
import { motion } from "framer-motion";

type RippleLoaderProps = {
  icon?: React.ReactNode;
  size?: number;
  duration?: number;
  logoColor?: string;
};

const RippleLoader: React.FC<RippleLoaderProps> = ({
  icon,
  size = 250,
  duration = 2,
  logoColor = "grey"
}) => {
  const baseInset = 40;
  const rippleBoxes = Array.from({ length: 5 }, (_, index) => ({
    inset: `${baseInset - index * 10}%`,
    zIndex: 99 - index,
    delay: index * 0.2,
    opacity: 1 - index * 0.2
  }));

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {rippleBoxes.map((box, index) => (
        <motion.div
          key={index}
          animate={{
            scale: [1, 1.3, 1],
            boxShadow: [
              "rgba(0, 0, 0, 0.3) 0px 10px 10px 0px",
              "rgba(0, 0, 0, 0.3) 0px 30px 20px 0px",
              "rgba(0, 0, 0, 0.3) 0px 10px 10px 0px"
            ]
          }}
          className="absolute rounded-full border-t backdrop-blur-[5px]"
          style={{
            inset: box.inset,
            zIndex: box.zIndex,
            borderColor: `rgba(100,100,100,${box.opacity})`,
            background: "linear-gradient(0deg, rgba(50, 50, 50, 0.2), rgba(100, 100, 100, 0.2))"
          }}
          transition={{
            repeat: Infinity,
            duration,
            delay: box.delay,
            ease: "easeInOut"
          }}
        />
      ))}

      <div className="absolute inset-0 grid place-content-center" style={{ zIndex: 100, padding: `${baseInset / 2}%` }}>
        <motion.span
          animate={{ color: [logoColor, "#ffffff", logoColor] }}
          className="w-full h-full"
          transition={{
            repeat: Infinity,
            duration,
            delay: 0.1,
            ease: "easeInOut"
          }}
        >
          <span className="w-full h-full text-foreground" style={{ display: "inline-block", width: "100%", height: "100%" }}>
            {React.isValidElement(icon)
              ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
                  className: "w-full h-full"
                })
              : icon}
          </span>
        </motion.span>
      </div>
    </div>
  );
};

export default RippleLoader;
