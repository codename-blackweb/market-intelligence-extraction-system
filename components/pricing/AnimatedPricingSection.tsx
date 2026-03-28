"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { Check } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import type { UserPlan } from "@/types/market-analysis";
import { VideoSurface, VideoText } from "@/components/ui/VideoText";

type BillingCycle = "monthly" | "annual";

type PricingPlan = {
  id: UserPlan;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  cta: string;
  highlight?: boolean;
  note?: string;
  glowColor: string;
};

type TabsContextValue = {
  value: BillingCycle;
  onValueChange: (nextValue: BillingCycle) => void;
};

const VIDEO_TEXT_SRC = "/assets/gradient-video.mp4";

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error("Tabs components must be used within Tabs.");
  }

  return context;
}

function Tabs({
  children,
  value,
  onValueChange
}: {
  children: ReactNode;
  value: BillingCycle;
  onValueChange: (nextValue: BillingCycle) => void;
}) {
  const contextValue = useMemo(
    () => ({
      value,
      onValueChange
    }),
    [value, onValueChange]
  );

  return <TabsContext.Provider value={contextValue}>{children}</TabsContext.Provider>;
}

function TabsList({ children }: { children: ReactNode }) {
  return <div className="pricing-tabs-list">{children}</div>;
}

function TabsTrigger({
  children,
  value
}: {
  children: ReactNode;
  value: BillingCycle;
}) {
  const { value: activeValue, onValueChange } = useTabsContext();
  const isActive = activeValue === value;

  return (
    <button
      aria-pressed={isActive}
      className={`pricing-tabs-trigger ${isActive ? "is-active" : ""}`}
      onClick={() => onValueChange(value)}
      type="button"
    >
      {isActive ? (
        <VideoSurface
          src={VIDEO_TEXT_SRC}
          className="pricing-tabs-trigger-surface"
          overlayClassName="pricing-tabs-trigger-surface-overlay"
        />
      ) : null}
      <span className="pricing-tabs-trigger-label">{children}</span>
    </button>
  );
}

function TabsContent({
  children,
  value
}: {
  children: ReactNode;
  value: BillingCycle;
}) {
  const { value: activeValue } = useTabsContext();

  if (activeValue !== value) {
    return null;
  }

  return <div>{children}</div>;
}

function GlowingCards({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={`glowing-cards ${className}`.trim()} variants={gridVariants}>
      {children}
    </motion.div>
  );
}

function GlowingCard({
  children,
  highlighted = false,
  current = false,
  glowColor
}: {
  children: ReactNode;
  highlighted?: boolean;
  current?: boolean;
  glowColor: string;
}) {
  return (
    <motion.article
      className={`glowing-card ${highlighted ? "is-highlighted" : ""} ${current ? "is-current" : ""}`}
      variants={cardVariants}
      whileHover={{ scale: 1.018, y: -4 }}
    >
      <div
        className="glowing-card-aura"
        aria-hidden="true"
        style={{
          background: `radial-gradient(circle, ${glowColor}55 0%, transparent 62%)`
        }}
      />
      {children}
    </motion.article>
  );
}

function GradientButton({
  children,
  onClick,
  disabled = false,
  secondary = false,
  videoFill = false
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  secondary?: boolean;
  videoFill?: boolean;
}) {
  return (
    <button
      className={`gradient-button ${secondary ? "is-secondary" : ""} ${videoFill ? "has-video-fill" : ""}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {videoFill ? (
        <VideoSurface
          src={VIDEO_TEXT_SRC}
          className="gradient-button-surface"
          overlayClassName="gradient-button-surface-overlay"
        />
      ) : null}
      <span className="gradient-button-label">{children}</span>
    </button>
  );
}

function CountUp({
  value,
  children
}: {
  value: number;
  children: (displayValue: number) => ReactNode;
}) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let animationFrame = 0;
    const duration = 520;
    const startedAt = performance.now();
    const previousValue = displayValue;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = Math.round(previousValue + (value - previousValue) * eased);
      setDisplayValue(nextValue);

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(tick);
      }
    };

    animationFrame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [value]);

  return <>{children(displayValue)}</>;
}

const plans: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Start with real demand signals and validate fast.",
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      "Unlimited HYBRID analyses",
      "5 LIVE analyses per day",
      "Saved analyses",
      "Shareable report links",
      "Basic export",
      "Signal strength and narrative output"
    ],
    cta: "Start Free",
    glowColor: "#ff6b6b"
  },
  {
    id: "pro",
    name: "Pro",
    description: "Full intelligence, deeper synthesis, and export-ready output.",
    monthlyPrice: 29,
    annualPrice: 290,
    features: [
      "Unlimited LIVE analyses",
      "Deep synthesis",
      "Advanced generators",
      "Full structured export",
      "Compare runs",
      "Source evidence and tags",
      "Competitor inputs",
      "Higher reasoning quality"
    ],
    cta: "Unlock Pro",
    highlight: true,
    note: "Most users upgrade after their first 3 searches.",
    glowColor: "#6bc1ff"
  },
  {
    id: "agency",
    name: "Agency",
    description: "Client-ready intelligence for teams, delivery, and scale.",
    monthlyPrice: 79,
    annualPrice: 790,
    features: [
      "Everything in Pro",
      "Multi-workspace support",
      "Team usage",
      "White-label exports",
      "Client-ready reports",
      "Premium export controls",
      "Higher storage limits"
    ],
    cta: "Choose Agency",
    glowColor: "#6bff95"
  }
];

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: "easeOut"
    }
  }
};

const gridVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08
    }
  }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.42,
      ease: "easeOut"
    }
  }
};

type Props = {
  currentPlan: UserPlan;
  focusState?: boolean;
  message: string;
  onSelectPlan: (plan: UserPlan) => void;
  initialBillingCycle?: BillingCycle;
};

export default function AnimatedPricingSection({
  currentPlan,
  focusState = false,
  message,
  onSelectPlan,
  initialBillingCycle = "monthly"
}: Props) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialBillingCycle);

  const renderCards = (cycle: BillingCycle) => (
    <GlowingCards className="pricing02-cards">
      {plans.map((plan) => {
        const isCurrent = currentPlan === plan.id;
        const displayPrice = cycle === "monthly" ? plan.monthlyPrice : plan.annualPrice;

        return (
          <GlowingCard
            current={isCurrent}
            glowColor={plan.glowColor}
            highlighted={plan.highlight}
            key={`${plan.id}-${cycle}`}
          >
            <div className="glowing-card-header pricing02-card-header">
              <VideoText
                as="div"
                src={VIDEO_TEXT_SRC}
                className="glowing-card-name glowing-card-name-video"
                fontSize="clamp(1.15rem, 2.3vw, 1.52rem)"
                fontWeight={700}
                fontFamily='"Manrope", "Avenir Next", "Inter", "Helvetica Neue", sans-serif'
                dominantBaseline="middle"
              >
                {plan.name}
              </VideoText>
              <p className="glowing-card-description">{plan.description}</p>
            </div>

            <div className="glowing-card-price-row pricing02-price-row">
              <CountUp value={displayPrice}>
                {(animatedValue) => (
                  <VideoText
                    as="div"
                    src={VIDEO_TEXT_SRC}
                    className="glowing-card-price-video"
                    fontSize="clamp(1.9rem, 4.35vw, 3.3rem)"
                    fontWeight={800}
                    fontFamily='"Manrope", "Avenir Next", "Inter", "Helvetica Neue", sans-serif'
                    dominantBaseline="middle"
                  >
                    {`$${animatedValue}`}
                  </VideoText>
                )}
              </CountUp>
              <VideoText
                as="div"
                src={VIDEO_TEXT_SRC}
                className="glowing-card-cycle glowing-card-cycle-video"
                fontSize="clamp(0.86rem, 1.2vw, 0.98rem)"
                fontWeight={700}
                fontFamily='"Manrope", "Avenir Next", "Inter", "Helvetica Neue", sans-serif'
                dominantBaseline="middle"
              >
                {cycle === "monthly" ? "/month" : "/year"}
              </VideoText>
            </div>

            <ul className="glowing-card-features pricing02-feature-list">
              {plan.features.map((feature) => (
                <li key={`${plan.id}-${feature}`}>
                  <span className="glowing-card-check-wrap" aria-hidden="true">
                    <Check className="glowing-card-check" size={14} />
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {plan.note ? <p className="glowing-card-note">{plan.note}</p> : null}

            <GradientButton
              disabled={isCurrent}
              onClick={() => onSelectPlan(plan.id)}
              secondary={!plan.highlight}
              videoFill={plan.id !== "free"}
            >
              {isCurrent ? "Current Plan" : plan.cta}
            </GradientButton>
          </GlowingCard>
        );
      })}
    </GlowingCards>
  );

  return (
    <motion.div
      animate="visible"
      className={`pricing-shell ${focusState ? "is-focused" : ""}`}
      initial="hidden"
      variants={containerVariants}
    >
      <div className="pricing-copy">
        {message !== "Unlock full intelligence" ? (
          <p className="pricing-context-message">{message}</p>
        ) : null}
        <VideoText
          as="div"
          src={VIDEO_TEXT_SRC}
          className="pricing-heading-video"
          fontSize="clamp(1.8rem, 4vw, 3.2rem)"
          fontWeight={700}
          fontFamily='"Manrope", "Avenir Next", "Inter", "Helvetica Neue", sans-serif'
          dominantBaseline="middle"
        >
          Unlock Full Intelligence
        </VideoText>
        <p className="field-copy result-copy">
          Start free, validate demand fast, and unlock deeper intelligence when you need it.
        </p>
      </div>

      <Tabs onValueChange={setBillingCycle} value={billingCycle}>
        <div className="pricing-tabs-shell pricing02-tabs-shell">
          <TabsList>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="annual">Annual</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="monthly">{renderCards("monthly")}</TabsContent>

        <TabsContent value="annual">{renderCards("annual")}</TabsContent>
      </Tabs>

      <div className="pricing-support-copy">
        <p>You’re already sitting on demand. We just surface it.</p>
      </div>
    </motion.div>
  );
}
