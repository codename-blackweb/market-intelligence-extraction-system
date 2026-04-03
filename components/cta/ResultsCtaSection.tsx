"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Zap } from "lucide-react";
import { VideoSurface, VideoText } from "@/components/ui/VideoText";
import type { UserPlan } from "@/types/market-analysis";
import styles from "@/components/home/main-page-refinements.module.css";

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
            <div className={`results-cta-badge ${styles.resultsCtaBadge}`}>
              <Zap className={`results-cta-badge-icon ${styles.resultsCtaBadgeIcon}`} />
              <span>Real Demand. Clear Direction.</span>
            </div>

            <div aria-level={2} className="results-cta-title-video-wrap" role="heading">
              <VideoText
                as="div"
                src="/assets/gradient-video.mp4"
                className="results-cta-title-video results-cta-title-video-desktop"
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
                STOP GUESSING WHAT THE MARKET WANTS.
                {"\n"}
                SEE THE SIGNAL. MOVE WITH CONFIDENCE.
              </VideoText>
              <VideoText
                as="div"
                src="/assets/gradient-video.mp4"
                className="results-cta-title-video results-cta-title-video-mobile"
                fontSize="clamp(1.36rem, 5.1vw, 2rem)"
                fontWeight={700}
                fontFamily='"Manrope", "Avenir Next", "Inter", "Helvetica Neue", sans-serif'
                textAnchor="middle"
                dominantBaseline="middle"
                autoPlay
                muted
                loop
                preload="auto"
              >
                STOP GUESSING WHAT
                {"\n"}
                THE MARKET WANTS.
                {"\n"}
                SEE THE SIGNAL.
                {"\n"}
                MOVE WITH CONFIDENCE.
              </VideoText>
            </div>

            <p className={`results-cta-copy ${styles.resultsCtaCopy}`}>
              Run live demand analysis, surface what people actually want, and turn messy
              search behavior into usable positioning, messaging, and strategic direction.
            </p>

            <div className="results-cta-actions">
              <button
                className={`results-cta-primary ${styles.mainVideoFillButton}`}
                onClick={isFreePlan ? onUpgrade : onRunAnother}
                type="button"
              >
                <VideoSurface
                  src="/assets/gradient-video.mp4"
                  className={styles.buttonSurface}
                  overlayClassName={styles.buttonOverlay}
                  autoPlay
                  muted
                  loop
                  preload="auto"
                />
                <span className={styles.buttonLabel}>
                  {isFreePlan ? "Unlock Pro" : "Run Another Analysis"}
                </span>
              </button>

              {isFreePlan ? (
                <button
                  className={`results-cta-secondary ${styles.mainVideoFillButton} ${styles.mainVideoFillButtonSubtle}`}
                  onClick={onRunAnother}
                  type="button"
                >
                  <VideoSurface
                    src="/assets/gradient-video.mp4"
                    className={styles.buttonSurface}
                    overlayClassName={styles.buttonOverlay}
                    autoPlay
                    muted
                    loop
                    preload="auto"
                  />
                  <span className={styles.buttonLabel}>Run Another Analysis</span>
                </button>
              ) : null}
            </div>

            <div className={`results-cta-benefits ${styles.resultsCtaBenefits}`}>
              {benefits.map((benefit) => (
                <div className={`results-cta-benefit ${styles.resultsCtaBenefit}`} key={benefit}>
                  <CheckCircle2 className={`results-cta-benefit-icon ${styles.resultsCtaBenefitIcon}`} />
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
