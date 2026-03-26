"use client";

import React, { useMemo } from "react";
import { motion, type Transition } from "framer-motion";
import { Sun, Cloud, MessageSquare, Briefcase, Zap } from "lucide-react";
import { useMotionPolicy } from "@/lib/motion-policy";

export type OrbitConfig = {
  id: number;
  radiusFactor: number;
  speed: number;
  icon: React.ReactNode;
  iconSize: number;
  orbitColor?: string;
  orbitThickness?: number;
};

export type BeamCircleProps = {
  size?: number;
  orbits?: OrbitConfig[];
  centerIcon?: React.ReactNode;
};

type IconElementProps = {
  size?: number;
  className?: string;
};

const defaultOrbits: OrbitConfig[] = [
  {
    id: 1,
    radiusFactor: 0.15,
    speed: 7,
    icon: <Zap className="beam-orbit-icon beam-orbit-icon-zap" />,
    iconSize: 20,
    orbitColor: "rgba(255, 193, 7, 0.4)",
    orbitThickness: 1.5
  },
  {
    id: 2,
    radiusFactor: 0.35,
    speed: 12,
    icon: <MessageSquare className="beam-orbit-icon beam-orbit-icon-message" />,
    iconSize: 24,
    orbitThickness: 1.5
  },
  {
    id: 3,
    radiusFactor: 0.55,
    speed: 9,
    icon: <Briefcase className="beam-orbit-icon beam-orbit-icon-briefcase" />,
    iconSize: 28,
    orbitColor: "rgba(76, 175, 80, 0.4)",
    orbitThickness: 2
  },
  {
    id: 4,
    radiusFactor: 0.75,
    speed: 15,
    icon: <Cloud className="beam-orbit-icon beam-orbit-icon-cloud" />,
    iconSize: 32,
    orbitThickness: 1
  }
];

export const BeamCircle: React.FC<BeamCircleProps> = ({
  size = 300,
  orbits: customOrbits,
  centerIcon
}) => {
  const policy = useMotionPolicy();
  const orbitsData = useMemo(
    () => (customOrbits || defaultOrbits).slice(0, policy.maxOrbitCount),
    [customOrbits, policy.maxOrbitCount]
  );
  const halfSize = size / 2;

  const linearEase = (t: number) => t;

  const rotationTransition = (duration: number): Transition => ({
    repeat: Infinity,
    duration,
    ease: linearEase
  });

  const CenterIcon = useMemo(
    () => (
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        className="beam-center-core"
        style={{ width: halfSize * 0.2, height: halfSize * 0.2 }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        {centerIcon ? centerIcon : <Sun className="beam-center-icon" size={halfSize * 0.1} />}
      </motion.div>
    ),
    [halfSize, centerIcon]
  );

  return (
    <div className="beam-circle-shell">
      <div className="beam-circle-stage" style={{ width: size, height: size }}>
        {orbitsData.map((orbit) => {
          const orbitDiameter = size * orbit.radiusFactor;
          const orbitRadius = orbitDiameter / 2;

          return (
            <React.Fragment key={orbit.id}>
              <div
                className={`beam-circle-line${orbit.orbitColor ? "" : " beam-circle-line-default"}`}
                style={{
                  width: orbitDiameter,
                  height: orbitDiameter,
                  top: halfSize - orbitRadius,
                  left: halfSize - orbitRadius,
                  borderColor: orbit.orbitColor || undefined,
                  borderWidth: orbit.orbitThickness || 1
                }}
              />

              <motion.div
                animate={{ rotate: 360 }}
                className="beam-circle-rotator"
                style={{ width: size, height: size }}
                transition={rotationTransition(orbit.speed)}
              >
                <div
                  className="beam-circle-traveler"
                  style={{
                    top: halfSize,
                    left: halfSize + orbitRadius,
                    transform: "translate(-50%, -50%)"
                  }}
                >
                  <motion.div
                    animate={{ rotate: -360 }}
                    className="beam-circle-badge"
                    style={{ width: orbit.iconSize, height: orbit.iconSize }}
                    transition={rotationTransition(orbit.speed)}
                  >
                    {React.isValidElement(orbit.icon)
                      ? React.cloneElement(orbit.icon as React.ReactElement<IconElementProps>, {
                          size: orbit.iconSize * 0.6
                        })
                      : orbit.icon}
                  </motion.div>
                </div>
              </motion.div>
            </React.Fragment>
          );
        })}

        <div className="beam-circle-center">{CenterIcon}</div>
      </div>
    </div>
  );
};

export default BeamCircle;
