"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export type IntelligenceTimelineStep = {
  title: string;
  time: string;
  description: string;
  icon: LucideIcon;
  accent: string;
};

type IntelligenceTimelineProps = {
  steps: IntelligenceTimelineStep[];
};

export function IntelligenceTimeline({ steps }: IntelligenceTimelineProps) {
  return (
    <div className="intelligence-timeline">
      <div className="intelligence-timeline-spine" aria-hidden="true" />
      <div className="intelligence-timeline-stack">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLeft = index % 2 === 0;

          return (
            <div
              className={`intelligence-timeline-item ${isLeft ? "is-left" : ""}`}
              key={`${step.time}-${step.title}`}
              style={{ "--timeline-accent": step.accent } as CSSProperties}
            >
              <div className="intelligence-timeline-marker" aria-hidden="true">
                <motion.div
                  className="intelligence-timeline-marker-core"
                  initial={{ scale: 0 }}
                  transition={{ duration: 0.45, delay: 0.08 }}
                  viewport={{ once: true }}
                  whileInView={{ scale: 1 }}
                />
              </div>

              <motion.article
                className="intelligence-timeline-card"
                initial={{ opacity: 0, x: isLeft ? -42 : 42 }}
                transition={{ duration: 0.55, delay: 0.08 }}
                viewport={{ once: true, margin: "-80px" }}
                whileInView={{ opacity: 1, x: 0 }}
              >
                <p className="intelligence-timeline-time">{step.time}</p>
                <h3 className="intelligence-timeline-title">{step.title}</h3>
                <p className="intelligence-timeline-description">{step.description}</p>

                <div className="intelligence-timeline-footer">
                  <div className="intelligence-timeline-icon-block">
                    <Icon className="intelligence-timeline-icon" />
                  </div>
                </div>
              </motion.article>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default IntelligenceTimeline;
