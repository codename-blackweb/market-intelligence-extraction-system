"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Zap } from "lucide-react";
import { VideoText } from "@/components/ui/VideoText";
import type { UserPlan } from "@/types/market-analysis";

type Props = {
  plan: UserPlan;
  onRunAnother: () => void;
  onUpgrade: () => void;
};

const benefits = [
  "Real search demand signals",
  "Structured intelligence output",
  "Export-ready strategy"
];

export default function ResultsCtaSection({ plan, onRunAnother, onUpgrade }: Props) {
  const isFreePlan = plan === "free";

  return (
    <section className="results-cta-section max-w-5xl mx-auto px-6 pb-20">
      <div className="results-cta-shell">
        <div className="results-cta-glow results-cta-glow-left" aria-hidden="true" />
        <div className="results-cta-glow results-cta-glow-right" aria-hidden="true" />

        <div className="card results-cta-card">
          <motion.div
            className="results-cta-content"
            initial={{ opacity: 0, scale: 0.95 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, scale: 1 }}
          >
            <div className="results-cta-badge">
              <Zap className="results-cta-badge-icon" />
              <span>Real demand. Clear direction.</span>
            </div>

            <div aria-level={2} className="results-cta-title-video-wrap" role="heading">
              <VideoText
                as="div"
                src="/assets/gradient-video.mp4"
                className="results-cta-title-video"
                fontSize="clamp(1.72rem, 3vw, 3.05rem)"
                fontWeight={700}
                fontFamily='"Manrope", "Avenir Next", "Inter", "Helvetica Neue", sans-serif'
                textAnchor="middle"
                dominantBaseline="middle"
                autoPlay
                muted
                loop
                preload="auto"
              >
                Stop guessing what the market wants.
                {"\n"}
                See the signal. Move with confidence.
              </VideoText>
            </div>

            <p className="results-cta-copy">
              Run live demand analysis, surface what people actually want, and turn messy
              search behavior into usable positioning, messaging, and strategic direction.
            </p>

            <div className="results-cta-actions">
              <button
                className="results-cta-primary"
                onClick={isFreePlan ? onUpgrade : onRunAnother}
                type="button"
              >
                {isFreePlan ? (
                  <VideoText
                    as="div"
                    src="/assets/gradient-video.mp4"
                    className="button-video-text button-video-text-cta"
                    fontSize="1rem"
                    fontWeight={700}
                    fontFamily='"Manrope", "Avenir Next", "Inter", "Helvetica Neue", sans-serif'
                    textAnchor="middle"
                    dominantBaseline="middle"
                    autoPlay
                    muted
                    loop
                    preload="auto"
                  >
                    Unlock Pro
                  </VideoText>
                ) : (
                  "Run Another Analysis"
                )}
              </button>

              {isFreePlan ? (
                <button className="results-cta-secondary" onClick={onRunAnother} type="button">
                  Run Another Analysis
                </button>
              ) : null}
            </div>

            <div className="results-cta-benefits">
              {benefits.map((benefit) => (
                <div className="results-cta-benefit" key={benefit}>
                  <CheckCircle2 className="results-cta-benefit-icon" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
