"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, HelpCircle, Minus, Plus } from "lucide-react";

const faqs = [
  {
    question: "What does this actually do?",
    answer:
      "It extracts real demand signals from search behavior and turns them into structured insights. Instead of guessing what people want, you see the exact problems, language, and patterns already present in the market."
  },
  {
    question: "How is this different from keyword tools?",
    answer:
      "Keyword tools give you volume and surface-level data. This system clusters intent, identifies patterns, and translates raw demand into positioning, messaging, and strategic direction."
  },
  {
    question: "What does “HYBRID” vs “LIVE” analysis mean?",
    answer:
      "HYBRID combines pre-processed intelligence with live signals for fast results. LIVE runs deeper analysis using real-time data and produces higher-quality synthesis."
  },
  {
    question: "What do I actually get after running analysis?",
    answer:
      "You get structured outputs including problems, language patterns, clustered demand signals, competitor positioning, gaps, and a recommended strategic direction."
  },
  {
    question: "Is this meant for founders, marketers, or agencies?",
    answer:
      "All three. Founders use it to validate ideas. Marketers use it to refine messaging. Agencies use it to generate strategy and client insights."
  },
  {
    question: "Do I need to understand SEO or data analysis?",
    answer:
      "No. The system translates raw search behavior into readable, usable insights. It’s designed to remove complexity, not add to it."
  },
  {
    question: "Why would I upgrade to Pro?",
    answer:
      "Pro unlocks deeper analysis, more accurate synthesis, advanced generators, and export-ready intelligence you can actually use in decision-making and execution."
  },
  {
    question: "Can I save and compare analyses?",
    answer:
      "Yes. Analyses are tied to your account and can be revisited, compared, and used to track shifts in market demand over time."
  }
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="faq-section">
      <div className="faq-container">
        <div className="faq-grid">
          <div className="faq-header-shell">
            <motion.div
              className="faq-header"
              initial={{ opacity: 0, x: -20 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <div className="faq-badge">
                <HelpCircle className="faq-badge-icon" />
                <span>Understand the system</span>
              </div>

              <h2 className="faq-title">
                What this actually <span>does</span>
              </h2>

              <p className="faq-copy">
                This isn’t another keyword tool. It’s a system for extracting real demand
                signals and turning them into usable strategic direction.
              </p>

              <button className="faq-support-button" type="button">
                Need deeper help
                <ArrowUpRight className="faq-support-icon" />
              </button>
            </motion.div>
          </div>

          <div className="faq-accordion-shell">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;

              return (
                <motion.article
                  className={`faq-item ${isOpen ? "is-open" : ""}`}
                  key={faq.question}
                  layout
                  transition={{ duration: 0.28, ease: "easeOut" }}
                >
                  <button
                    aria-expanded={isOpen}
                    className="faq-trigger"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    type="button"
                  >
                    <span className="faq-question">{faq.question}</span>
                    <span className="faq-icon-shell" aria-hidden="true">
                      {isOpen ? <Minus className="faq-icon" /> : <Plus className="faq-icon" />}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        className="faq-answer-shell"
                        exit={{ height: 0, opacity: 0 }}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        transition={{ duration: 0.28, ease: "easeOut" }}
                      >
                        <div className="faq-divider" />
                        <p className="faq-answer">{faq.answer}</p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
