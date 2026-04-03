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
import {
  computeTypingDelay,
  generateResponse,
  getAssistantProfile,
  getInitialAssistantMessage
} from "@/components/chat/responseEngine";
import { Button } from "@/components/ui/button";
import { VideoText } from "@/components/ui/VideoText";

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
const assistantProfile = getAssistantProfile();

export default function IntentEngineAssistant({
  open,
  onClose
}: IntentEngineAssistantProps) {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>(() => [
    {
      id: "assistant-1",
      role: "assistant",
      content: getInitialAssistantMessage(),
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
    const assistantContent = generateResponse(trimmed);
    const typingDelay = computeTypingDelay(trimmed, assistantContent);

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
        content: assistantContent,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
      typingTimeoutRef.current = null;
    }, typingDelay);
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
                    <VideoText
                      as="h3"
                      id={titleId}
                      src="/assets/gradient-video.mp4"
                      className="intent-assistant-title"
                      fontSize="clamp(2.4rem, 4.6vw, 3.35rem)"
                      fontWeight={800}
                      fontFamily='"Manrope", "Avenir Next", "Inter", "Helvetica Neue", sans-serif'
                      textAnchor="start"
                      textX="0%"
                      dominantBaseline="middle"
                      maskPosition="left center"
                      maskSize="100% 100%"
                      autoPlay
                      muted
                      loop
                      preload="auto"
                      style={{
                        width: "min(100%, 14rem)",
                        height: "3.35rem",
                        margin: 0,
                        flex: "0 0 auto",
                        overflow: "hidden"
                      }}
                    >
                      {assistantProfile.name}
                    </VideoText>
                    <span className="intent-assistant-badge">{assistantProfile.badge}</span>
                  </div>
                  <p className="intent-assistant-subtitle">{assistantProfile.subtitle}</p>
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
