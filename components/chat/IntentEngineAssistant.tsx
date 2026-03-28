"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Mic,
  MoreHorizontal,
  Paperclip,
  Send,
  Sparkles,
  User,
  X
} from "lucide-react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type IntentEngineAssistantProps = {
  open: boolean;
  onClose: () => void;
};

type AssistantBranch = {
  id:
    | "signal"
    | "intent"
    | "objection"
    | "messaging"
    | "positioning"
    | "test"
    | "competition"
    | "fallback";
  keywords: string[];
  respond: () => string;
};

const INITIAL_MESSAGE =
  "Hi. I can help you go deeper on search demand, buyer intent, message angles, objection patterns, and market signals. What do you want to unpack?";

const RESPONSE_BRANCHES: AssistantBranch[] = [
  {
    id: "signal",
    keywords: [
      "signal",
      "signals",
      "interpret",
      "meaning",
      "cluster",
      "clusters",
      "pattern",
      "patterns",
      "theme",
      "themes",
      "demand",
      "read the market",
      "read the signals",
      "what do the signals mean",
      "decode"
    ],
    respond: () =>
      "Read the signal set in layers: repeated problems show persistence, exact wording shows emotion, and clustered query patterns show where the market keeps circling the same pain. Broad educational searches usually mean curiosity, while repeated solution-aware phrasing usually means demand is consolidating around a clear need. The useful move is to separate noisy interest from repeated friction and let the repeated friction shape the strategy."
  },
  {
    id: "intent",
    keywords: [
      "buyer intent",
      "intent",
      "purchase intent",
      "high intent",
      "ready to buy",
      "buying",
      "commercial",
      "strong intent"
    ],
    respond: () =>
      "Strong buyer intent shows up when people stop describing the category and start describing the decision. Look for queries with urgency, comparisons, implementation language, alternatives, pricing, timelines, or outcome specificity. If those phrases repeat across related searches, you are not looking at casual curiosity anymore. You are looking at people trying to reduce risk before they choose."
  },
  {
    id: "objection",
    keywords: [
      "objection",
      "objections",
      "hesitation",
      "hesitations",
      "resistance",
      "pushback",
      "concern",
      "concerns",
      "trust issue",
      "doubt"
    ],
    respond: () =>
      "Objections usually hide inside queries about risk, cost, complexity, time, credibility, or whether the promised result will actually happen. Watch for phrases that imply fear of wasting money, picking the wrong option, taking on extra work, or failing to get the outcome. Those are the lines you want to answer directly in messaging, proof, onboarding, and offer design."
  },
  {
    id: "messaging",
    keywords: [
      "message angle",
      "messaging",
      "angle",
      "angles",
      "copy",
      "headline",
      "hook",
      "ad angle",
      "email angle"
    ],
    respond: () =>
      "The strongest messaging angles come from the overlap between urgent pain, desired outcome, and the language people already use on their own. Start with the phrase pattern that feels most repeated and emotionally charged, then frame the promise around speed, clarity, or risk reduction. Good angles do not invent desire. They organize demand that is already visible."
  },
  {
    id: "positioning",
    keywords: [
      "positioning",
      "position",
      "differentiate",
      "differentiation",
      "category",
      "frame the offer",
      "market position"
    ],
    respond: () =>
      "Positioning should come from where the market feels underserved, not from where the product team feels clever. Find the pain cluster with the highest urgency, compare how competitors frame it, then choose the tension they leave unresolved. If the market keeps repeating the same frustration and nobody owns a clean answer, that is where your position gets sharper."
  },
  {
    id: "test",
    keywords: [
      "test",
      "testing",
      "experiment",
      "experiments",
      "which move should i test",
      "what should i test",
      "next step",
      "next steps",
      "what next",
      "what now",
      "next move",
      "prioritize",
      "validation"
    ],
    respond: () =>
      "Test the smallest strategic move that can confirm demand quality fast. Start with one audience, one problem framing, and one promise, then put it into a landing page, ad, or outbound message. Prioritize the experiment that sits closest to repeated high-intent search language, because that is where you get the cleanest feedback on whether the demand is real or just descriptive noise."
  },
  {
    id: "competition",
    keywords: [
      "competitor",
      "competitors",
      "competition",
      "compare",
      "comparison",
      "alternatives",
      "vs",
      "versus"
    ],
    respond: () =>
      "Use competitors as a framing dataset, not just a feature checklist. Look at what promises they repeat, what anxieties they answer, and which outcomes they push hardest. Then compare that against the unmet language in the market. The gap between what buyers keep asking and what competitors keep emphasizing is usually where the strategic opening lives."
  },
  {
    id: "fallback",
    keywords: [],
    respond: () =>
      "Start by isolating the repeated problem language, then separate early curiosity from high-intent search behavior. From there, compare the strongest demand cluster against competitor framing and look for the tension nobody is resolving clearly. If you want, ask me about signals, buyer intent, objections, messaging, positioning, testing, or competitors and I can go narrower."
  }
];

function normalizePrompt(input: string) {
  return input.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

function scoreIntent(prompt: string, keywords: string[]) {
  return keywords.reduce((score, keyword) => {
    if (!prompt.includes(keyword)) {
      return score;
    }

    if (keyword.includes(" ")) {
      return score + 3;
    }

    return score + 1;
  }, 0);
}

function buildReply(input: string) {
  const prompt = normalizePrompt(input);
  const rankedBranches = RESPONSE_BRANCHES.filter((branch) => branch.id !== "fallback")
    .map((branch) => ({
      branch,
      score: scoreIntent(prompt, branch.keywords)
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  const primaryBranch = rankedBranches[0]?.branch;

  if (!primaryBranch) {
    return RESPONSE_BRANCHES.find((branch) => branch.id === "fallback")!.respond();
  }

  if (primaryBranch.id === "signal" && prompt.includes("competitor")) {
    return `${primaryBranch.respond()} ${RESPONSE_BRANCHES.find((branch) => branch.id === "competition")!.respond()}`;
  }

  if (primaryBranch.id === "positioning" && prompt.includes("message")) {
    return `${primaryBranch.respond()} ${RESPONSE_BRANCHES.find((branch) => branch.id === "messaging")!.respond()}`;
  }

  if (primaryBranch.id === "intent" && (prompt.includes("objection") || prompt.includes("hesitation"))) {
    return `${primaryBranch.respond()} ${RESPONSE_BRANCHES.find((branch) => branch.id === "objection")!.respond()}`;
  }

  if (primaryBranch.id === "test" && prompt.includes("competitor")) {
    return `${primaryBranch.respond()} ${RESPONSE_BRANCHES.find((branch) => branch.id === "competition")!.respond()}`;
  }

  return primaryBranch.respond();
}

export default function IntentEngineAssistant({
  open,
  onClose
}: IntentEngineAssistantProps) {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: "assistant-1",
      role: "assistant",
      content: INITIAL_MESSAGE,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const titleId = useMemo(() => "intent-assistant-title", []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.setTimeout(() => {
      textareaRef.current?.focus();
    }, 120);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }

    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [isTyping, messages]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSend = () => {
    const trimmed = input.trim();

    if (!trimmed) {
      return;
    }

    const userMessage: AssistantMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmed,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      const assistantMessage: AssistantMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: buildReply(trimmed),
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
      typingTimeoutRef.current = null;
    }, 1350);
  };

  if (!mounted) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="intent-assistant-overlay"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            aria-labelledby={titleId}
            aria-modal="true"
            className="intent-assistant-panel"
            exit={{ opacity: 0, y: 18, scale: 0.985 }}
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            <div className="intent-assistant-panel-edge" />

            <header className="intent-assistant-header">
              <div className="intent-assistant-header-main">
                <div className="intent-assistant-logo-shell">
                  <div className="intent-assistant-logo">
                    <Bot className="intent-assistant-logo-icon" />
                  </div>
                  <span className="intent-assistant-status" />
                </div>

                <div className="intent-assistant-title-block">
                  <div className="intent-assistant-title-row">
                    <h3 className="intent-assistant-title" id={titleId}>
                      IntentEngine Assistant
                    </h3>
                    <span className="intent-assistant-badge">PRO</span>
                  </div>
                  <p className="intent-assistant-subtitle">
                    SignalForge Intelligence Layer
                  </p>
                </div>
              </div>

              <div className="intent-assistant-header-actions">
                <Button
                  aria-label="Assistant signals"
                  className="intent-assistant-header-button"
                  variant="ghost"
                >
                  <Sparkles className="intent-assistant-header-icon" />
                </Button>
                <Button
                  aria-label="More assistant options"
                  className="intent-assistant-header-button"
                  variant="ghost"
                >
                  <MoreHorizontal className="intent-assistant-header-icon" />
                </Button>
                <Button
                  aria-label="Close assistant"
                  className="intent-assistant-header-button"
                  onClick={onClose}
                  variant="ghost"
                >
                  <X className="intent-assistant-header-icon" />
                </Button>
              </div>
            </header>

            <div className="intent-assistant-body">
              <div className="intent-assistant-scroll" ref={scrollRef}>
                <div className="intent-assistant-thread">
                  <AnimatePresence initial={false}>
                    {messages.map((message) => (
                      <motion.div
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`intent-assistant-message-row ${
                          message.role === "user" ? "is-user" : "is-assistant"
                        }`}
                        exit={{ opacity: 0, y: 6, scale: 0.985 }}
                        initial={{ opacity: 0, y: 10, scale: 0.97 }}
                        key={message.id}
                        transition={{ duration: 0.24, ease: "easeOut" }}
                      >
                        <div
                          className={`intent-assistant-message-shell ${
                            message.role === "user" ? "is-user" : "is-assistant"
                          }`}
                        >
                          <div className="intent-assistant-avatar-wrap" aria-hidden="true">
                            {message.role === "assistant" ? (
                              <div className="intent-assistant-avatar is-assistant">
                                <Bot className="intent-assistant-avatar-icon" />
                              </div>
                            ) : (
                              <div className="intent-assistant-avatar is-user">
                                <User className="intent-assistant-avatar-icon" />
                              </div>
                            )}
                          </div>

                          <div className="intent-assistant-bubble-stack">
                            <div
                              className={`intent-assistant-bubble ${
                                message.role === "user" ? "is-user" : "is-assistant"
                              }`}
                            >
                              {message.content}
                            </div>
                            <span className="intent-assistant-time">
                              {message.timestamp.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isTyping ? (
                    <motion.div
                      animate={{ opacity: 1, y: 0 }}
                      className="intent-assistant-message-row is-assistant"
                      initial={{ opacity: 0, y: 6 }}
                    >
                      <div className="intent-assistant-message-shell is-assistant">
                        <div className="intent-assistant-avatar-wrap" aria-hidden="true">
                          <div className="intent-assistant-avatar is-assistant">
                            <Bot className="intent-assistant-avatar-icon" />
                          </div>
                        </div>

                        <div className="intent-assistant-bubble is-assistant is-typing">
                          <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            className="intent-assistant-typing-dot"
                            transition={{ duration: 0.9, repeat: Infinity, delay: 0 }}
                          />
                          <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            className="intent-assistant-typing-dot"
                            transition={{ duration: 0.9, repeat: Infinity, delay: 0.2 }}
                          />
                          <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            className="intent-assistant-typing-dot"
                            transition={{ duration: 0.9, repeat: Infinity, delay: 0.4 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </div>
              </div>
            </div>

            <footer className="intent-assistant-footer">
              <div className="intent-assistant-input-shell">
                <Button
                  aria-label="Attach context"
                  className="intent-assistant-input-icon-button"
                  variant="ghost"
                >
                  <Paperclip className="intent-assistant-input-icon" />
                </Button>

                <textarea
                  className="intent-assistant-input"
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask about demand analysis, buyer intent, objections, or what the signals mean..."
                  ref={textareaRef}
                  rows={1}
                  value={input}
                />

                <div className="intent-assistant-footer-actions">
                  <Button
                    aria-label="Voice input"
                    className="intent-assistant-input-icon-button"
                    variant="ghost"
                  >
                    <Mic className="intent-assistant-input-icon" />
                  </Button>
                  <Button
                    aria-label="Send message"
                    className="intent-assistant-send-button"
                    disabled={!input.trim()}
                    onClick={handleSend}
                  >
                    <Send className="intent-assistant-send-icon" />
                  </Button>
                </div>
              </div>

              <p className="intent-assistant-note">
                Powered by <span>SignalForge intelligence</span>. Always verify
                AI-generated outputs.
              </p>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
