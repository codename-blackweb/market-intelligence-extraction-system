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
};

type TabsContextValue = {
  value: BillingCycle;
  onValueChange: (nextValue: BillingCycle) => void;
};

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
      {children}
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

function GlowingCards({ children }: { children: ReactNode }) {
  return <motion.div className="glowing-cards" variants={gridVariants}>{children}</motion.div>;
}

function GlowingCard({
  children,
  highlighted = false,
  current = false
}: {
  children: ReactNode;
  highlighted?: boolean;
  current?: boolean;
}) {
  return (
    <motion.article
      className={`glowing-card ${highlighted ? "is-highlighted" : ""} ${current ? "is-current" : ""}`}
      variants={cardVariants}
      whileHover={{ scale: 1.018, y: -4 }}
    >
      <div className="glowing-card-aura" aria-hidden="true" />
      {children}
    </motion.article>
  );
}

function GradientButton({
  children,
  onClick,
  disabled = false,
  secondary = false
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <button
      className={`gradient-button ${secondary ? "is-secondary" : ""}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span>{children}</span>
    </button>
  );
}

function CountUp({ value }: { value: number }) {
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

  return <>{displayValue}</>;
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
    cta: "Start Free"
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
    note: "Most users upgrade after their first 3 searches."
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
    cta: "Choose Agency"
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
};

export default function AnimatedPricingSection({
  currentPlan,
  focusState = false,
  message,
  onSelectPlan
}: Props) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

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
        <h2>Unlock full intelligence</h2>
        <p className="field-copy result-copy">
          Start free, validate demand fast, and unlock deeper intelligence when you need it.
        </p>
      </div>

      <Tabs onValueChange={setBillingCycle} value={billingCycle}>
        <div className="pricing-tabs-shell">
          <TabsList>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="annual">Annual</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="monthly">
          <GlowingCards>
            {plans.map((plan) => {
              const isCurrent = currentPlan === plan.id;

              return (
                <GlowingCard current={isCurrent} highlighted={plan.highlight} key={`${plan.id}-monthly`}>
                  <div className="glowing-card-header">
                    <div>
                      <p className="glowing-card-name">{plan.name}</p>
                      <p className="glowing-card-description">{plan.description}</p>
                    </div>
                    <div className="glowing-card-price-row">
                      <span className="glowing-card-currency">$</span>
                      <span className="glowing-card-price">
                        <CountUp value={plan.monthlyPrice} />
                      </span>
                      {plan.monthlyPrice > 0 ? (
                        <span className="glowing-card-cycle">/mo</span>
                      ) : null}
                    </div>
                  </div>

                  <ul className="glowing-card-features">
                    {plan.features.map((feature) => (
                      <li key={`${plan.id}-${feature}`}>
                        <Check className="glowing-card-check" size={16} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.note ? <p className="glowing-card-note">{plan.note}</p> : null}

                  <GradientButton
                    disabled={isCurrent}
                    onClick={() => onSelectPlan(plan.id)}
                    secondary={!plan.highlight}
                  >
                    {isCurrent ? "Current Plan" : plan.cta}
                  </GradientButton>
                </GlowingCard>
              );
            })}
          </GlowingCards>
        </TabsContent>

        <TabsContent value="annual">
          <GlowingCards>
            {plans.map((plan) => {
              const isCurrent = currentPlan === plan.id;

              return (
                <GlowingCard current={isCurrent} highlighted={plan.highlight} key={`${plan.id}-annual`}>
                  <div className="glowing-card-header">
                    <div>
                      <p className="glowing-card-name">{plan.name}</p>
                      <p className="glowing-card-description">{plan.description}</p>
                    </div>
                    <div className="glowing-card-price-row">
                      <span className="glowing-card-currency">$</span>
                      <span className="glowing-card-price">
                        <CountUp value={plan.annualPrice} />
                      </span>
                    </div>
                  </div>

                  <ul className="glowing-card-features">
                    {plan.features.map((feature) => (
                      <li key={`${plan.id}-${feature}`}>
                        <Check className="glowing-card-check" size={16} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.note ? <p className="glowing-card-note">{plan.note}</p> : null}

                  <GradientButton
                    disabled={isCurrent}
                    onClick={() => onSelectPlan(plan.id)}
                    secondary={!plan.highlight}
                  >
                    {isCurrent ? "Current Plan" : plan.cta}
                  </GradientButton>
                </GlowingCard>
              );
            })}
          </GlowingCards>
        </TabsContent>
      </Tabs>

      <div className="pricing-support-copy">
        <p>You’re already sitting on demand. We just surface it.</p>
        <p>Early users lock in current pricing.</p>
        <p>No contracts. Cancel anytime.</p>
      </div>
    </motion.div>
  );
}
