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

type QuestionForm =
  | "definition"
  | "process"
  | "interpretation"
  | "strategy"
  | "general";

type Topic =
  | "signal"
  | "analysis"
  | "intent"
  | "objection"
  | "messaging"
  | "positioning"
  | "competition"
  | "general";

type ResponseCategory =
  | "definition_explanation"
  | "process_mechanism"
  | "interpretation"
  | "strategy_next_step"
  | "objections"
  | "messaging_positioning"
  | "competition_comparison"
  | "fallback";

type MessageClass =
  | "casual_social"
  | "identity_meta"
  | "product_domain"
  | "follow_up_contextual"
  | "fallback_unknown";

type EmotionalTone =
  | "frustrated"
  | "confused"
  | "excited"
  | "overwhelmed"
  | "skeptical"
  | "curious"
  | "neutral";

const ASSISTANT_NAME = "Avery";
const ASSISTANT_BADGE = "GUIDE";
const ASSISTANT_SUBTITLE = "IntentEngine Strategy Guide";
const INITIAL_MESSAGE =
  "Hi, I’m Avery. I can help you make sense of search demand, buyer intent, objections, message angles, and what to test next. What are you looking at?";

const TOPIC_KEYWORDS: Record<Topic, string[]> = {
  signal: [
    "signal",
    "signals",
    "pattern",
    "patterns",
    "cluster",
    "clusters",
    "theme",
    "themes"
  ],
  analysis: [
    "analysis",
    "demand analysis",
    "engine",
    "pipeline",
    "workflow",
    "hybrid",
    "live",
    "run demand analysis"
  ],
  intent: [
    "buyer intent",
    "purchase intent",
    "strong intent",
    "intent",
    "ready to buy",
    "buying",
    "commercial"
  ],
  objection: [
    "objection",
    "objections",
    "hesitation",
    "hesitations",
    "concern",
    "concerns",
    "pushback",
    "doubt",
    "resistance"
  ],
  messaging: [
    "messaging",
    "message angle",
    "angle",
    "angles",
    "copy",
    "headline",
    "hook",
    "email angle",
    "ad angle"
  ],
  positioning: [
    "positioning",
    "position",
    "differentiate",
    "differentiation",
    "market position",
    "category",
    "frame the offer"
  ],
  competition: [
    "competitor",
    "competitors",
    "competition",
    "compare",
    "comparison",
    "alternatives",
    "alternative",
    "versus",
    "vs"
  ],
  general: []
};

function normalizePrompt(input: string) {
  return input.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

function scoreKeywords(prompt: string, keywords: string[]) {
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

function detectQuestionForm(prompt: string): QuestionForm {
  if (
    /^what do .* mean\b/.test(prompt) ||
    /^what does .* mean\b/.test(prompt) ||
    /^how do i interpret\b/.test(prompt) ||
    /^how should i interpret\b/.test(prompt) ||
    /^how do i know\b/.test(prompt) ||
    /^how can i tell\b/.test(prompt) ||
    prompt.includes("different signals mean")
  ) {
    return "interpretation";
  }

  if (
    /^which\b/.test(prompt) ||
    /^what should\b/.test(prompt) ||
    /^what next\b/.test(prompt) ||
    /^what now\b/.test(prompt) ||
    /^where should i start\b/.test(prompt) ||
    /^how should i proceed\b/.test(prompt) ||
    prompt.includes("next step") ||
    prompt.includes("next move") ||
    prompt.includes("should i test") ||
    prompt.includes("strategic move")
  ) {
    return "strategy";
  }

  if (
    /^what is\b/.test(prompt) ||
    /^what are\b/.test(prompt) ||
    /^define\b/.test(prompt) ||
    /^explain\b/.test(prompt) ||
    /^tell me what\b/.test(prompt) ||
    /^what s\b/.test(prompt)
  ) {
    return "definition";
  }

  if (
    /^how does\b/.test(prompt) ||
    /^how do\b/.test(prompt) ||
    /^how is\b/.test(prompt) ||
    prompt.includes("how this engine runs") ||
    prompt.includes("how the engine runs") ||
    prompt.includes("run demand analysis")
  ) {
    return "process";
  }

  return "general";
}

function detectTopic(prompt: string): Topic {
  const rankedTopics = (Object.entries(TOPIC_KEYWORDS) as Array<[Topic, string[]]>)
    .filter(([topic]) => topic !== "general")
    .map(([topic, keywords]) => ({
      topic,
      score: scoreKeywords(prompt, keywords)
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  return rankedTopics[0]?.topic ?? "general";
}

function resolveResponseCategory(form: QuestionForm, topic: Topic): ResponseCategory {
  if (topic === "objection") {
    return "objections";
  }

  if (topic === "messaging" || topic === "positioning") {
    return "messaging_positioning";
  }

  if (topic === "competition") {
    return "competition_comparison";
  }

  if (form === "strategy") {
    return "strategy_next_step";
  }

  if (form === "definition") {
    return "definition_explanation";
  }

  if (form === "process") {
    return "process_mechanism";
  }

  if (form === "interpretation") {
    return "interpretation";
  }

  return "fallback";
}

function buildDefinitionReply(topic: Topic) {
  switch (topic) {
    case "signal":
      return "A signal is a repeated clue that demand is real. In this engine, signals come from recurring phrases, repeated problem wording, and patterns in what people keep searching for. One isolated query is noise. Repeated language around the same pain, desired outcome, or buyer hesitation is a signal.";
    case "analysis":
      return "Demand analysis in this engine means collecting search behavior, clustering repeated language, classifying the market, and then translating that into strategic output. It is not just keyword lookup. It is a way of turning messy demand data into usable direction for positioning, messaging, and next moves.";
    case "intent":
      return "Buyer intent is the strength of the decision signal inside the query set. When searches shift from broad learning to comparisons, implementation details, pricing, alternatives, and urgency, intent is getting stronger because the buyer is trying to reduce risk before acting.";
    default:
      return "At the definition layer, the engine is trying to name the demand pattern clearly before making strategic claims. That means identifying what the market keeps repeating, what it is trying to solve, and how close that language is to an actual buying decision.";
  }
}

function buildProcessReply(topic: Topic) {
  switch (topic) {
    case "analysis":
      return "The engine runs demand analysis in five passes: it pulls visible search demand, groups repeated phrases into clusters, classifies the market context, surfaces pains and objections, and then turns that into usable strategy. The important part is that it does not stop at raw queries. It keeps moving until the output is decision-ready.";
    case "signal":
      return "Signals are processed by comparing repetition, phrasing, specificity, and how closely the query sits to a buying decision. The engine looks for language patterns that recur across the search set, then separates broad curiosity from higher-value demand themes. That is how a vague list of searches becomes an interpretable signal layer.";
    case "intent":
      return "Buyer intent is inferred by how the language changes. The engine looks for urgency, alternatives, implementation questions, price sensitivity, and outcome specificity. When those signals stack together, it treats the cluster as stronger intent because the market is moving from exploration into evaluation.";
    default:
      return "Mechanically, the engine takes raw search behavior, organizes it into patterns, and then adds interpretation on top so you can act on it. The process matters because a useful intelligence layer has to move from collection to classification to strategic synthesis.";
  }
}

function buildInterpretationReply(topic: Topic) {
  switch (topic) {
    case "signal":
      return "Different signals mean different levels of market pressure. Repeated pain language usually signals persistent demand. Specific outcome or comparison queries usually signal stronger buying intent. Hesitation language signals friction or trust gaps. The interpretation step is about asking whether the market is merely curious, actively struggling, or preparing to choose.";
    case "intent":
      return "To interpret buyer intent, look at how close the query is to action. Broad exploratory language sits lower on intent. Queries about cost, best option, alternatives, implementation, or timeline sit higher. The more those decision-shaped phrases repeat, the more confidence you should have that the market is leaning toward purchase behavior.";
    case "analysis":
      return "When you interpret an analysis output, read it from outside in: first the dominant pain cluster, then the language people use, then the objections and market gaps. That tells you whether the opportunity is mainly educational, comparative, or conversion-ready.";
    default:
      return "Interpretation is where the raw data becomes useful. The goal is to understand whether the repeated language points to a weak curiosity signal, a persistent pain pattern, or a decision-stage demand cluster you can actually build strategy around.";
  }
}

function buildStrategyReply(topic: Topic) {
  switch (topic) {
    case "intent":
      return "If buyer intent looks strong, the first move to test is a focused promise around the most repeated decision-stage query. Put that promise into a landing page, ad, or outbound message and see whether response quality stays high when the framing gets specific.";
    case "analysis":
    case "signal":
      return "The next strategic move should come from the highest-pressure cluster, not the broadest topic. Take the cluster with the strongest repeated pain plus the clearest decision language, then test one positioning claim against it. That gives you feedback on whether the signal is strong enough to support an offer or message direction.";
    default:
      return "Start with one testable move, not a full repositioning exercise. Pick the strongest pain cluster, use the exact buyer phrasing attached to it, and run one focused experiment around the promise or angle that seems most under-served by the market.";
  }
}

function buildObjectionReply() {
  return "Look for objections where the market is trying to protect itself from risk. That usually appears as concerns about cost, implementation effort, credibility, time to result, and whether the solution will actually work in their situation. Those patterns matter because they tell you what the market needs answered before it will move.";
}

function buildMessagingPositioningReply(topic: Topic) {
  if (topic === "positioning") {
    return "Positioning should come from the gap between what buyers keep repeating and what the market keeps over-explaining. Find the pain cluster with the highest urgency, compare how competitors frame it, and then take the angle that resolves the tension they leave exposed. That is where a sharper market position usually comes from.";
  }

  return "Good messaging angles come from repeated buyer language, not invented copywriting. Start with the exact words people use around pain, frustration, or desired outcome, then build the angle around speed, certainty, or risk reduction. Messaging gets stronger when it sounds like the market talking to itself.";
}

function buildCompetitionReply() {
  return "Use competitor analysis to compare what the market asks for against what existing players emphasize. Watch their promises, proof structure, objection handling, and category framing. If buyers keep repeating a need that competitors are only addressing weakly or indirectly, that is usually where the strategic opening is.";
}

function buildFallbackReply() {
  return "Start by isolating the repeated problem language, then separate early curiosity from decision-stage demand. From there, compare the strongest cluster against buyer intent, objections, and competitor framing so you can see whether the opportunity is real and where to move next. If you want, ask me to define something, explain how the engine works, interpret a signal, or suggest a next move.";
}

function hashText(input: string) {
  return [...input].reduce((value, character) => value + character.charCodeAt(0), 0);
}

function pickVariant<T>(items: T[], seed: string) {
  return items[hashText(seed) % items.length];
}

function detectEmotion(prompt: string): EmotionalTone {
  if (
    prompt.includes("frustrating") ||
    prompt.includes("annoying") ||
    prompt.includes("this sucks") ||
    prompt.includes("broken") ||
    prompt.includes("stuck")
  ) {
    return "frustrated";
  }

  if (
    prompt.includes("confusing") ||
    prompt.includes("confused") ||
    prompt.includes("unclear") ||
    prompt.includes("dont get") ||
    prompt.includes("do not get") ||
    prompt.includes("doesn t make sense") ||
    prompt.includes("does not make sense")
  ) {
    return "confused";
  }

  if (
    prompt.includes("awesome") ||
    prompt.includes("excited") ||
    prompt.includes("love this") ||
    prompt.includes("amazing") ||
    prompt.includes("lets go") ||
    prompt.includes("let s go")
  ) {
    return "excited";
  }

  if (
    prompt.includes("overwhelmed") ||
    prompt.includes("too much") ||
    prompt.includes("messy") ||
    prompt.includes("all over the place") ||
    prompt.includes("not sure where to start")
  ) {
    return "overwhelmed";
  }

  if (
    prompt.includes("skeptical") ||
    prompt.includes("not convinced") ||
    prompt.includes("sounds fake") ||
    prompt.includes("sounds wrong") ||
    prompt.includes("seems off") ||
    prompt.includes("i doubt")
  ) {
    return "skeptical";
  }

  if (
    prompt.includes("curious") ||
    prompt.includes("wondering") ||
    prompt.startsWith("why ") ||
    prompt.startsWith("how ")
  ) {
    return "curious";
  }

  return "neutral";
}

function isCasualPrompt(prompt: string) {
  return (
    /^(hi|hello|hey|yo|good morning|good afternoon|good evening)\b/.test(prompt) ||
    prompt.includes("how are you") ||
    prompt.includes("how is your day") ||
    prompt.includes("how s your day") ||
    prompt === "thanks" ||
    prompt === "thank you" ||
    prompt === "cool thanks" ||
    prompt === "nice thanks"
  );
}

function isIdentityMetaPrompt(prompt: string) {
  return (
    prompt.includes("what is your name") ||
    prompt.includes("what s your name") ||
    prompt.includes("who are you") ||
    prompt.includes("what are you") ||
    prompt.includes("are you an ai") ||
    prompt.includes("are you ai") ||
    prompt.includes("what can you help with") ||
    prompt.includes("what can you do") ||
    prompt.includes("how can you help") ||
    prompt.includes("what do you help with")
  );
}

function isFollowUpPrompt(prompt: string) {
  return (
    /^and\b/.test(prompt) ||
    /^so\b/.test(prompt) ||
    /^then\b/.test(prompt) ||
    /^what about\b/.test(prompt) ||
    /^which of those\b/.test(prompt) ||
    /^what about the second\b/.test(prompt) ||
    /^tell me more\b/.test(prompt) ||
    /^go deeper\b/.test(prompt) ||
    /^go deeper on that\b/.test(prompt) ||
    /^can you go deeper\b/.test(prompt) ||
    /^can you unpack\b/.test(prompt) ||
    /^why does that\b/.test(prompt) ||
    /^how does that\b/.test(prompt) ||
    /^how do i use that\b/.test(prompt) ||
    /^what should i do with that\b/.test(prompt) ||
    /^why does this matter\b/.test(prompt)
  );
}

function inferContextTopic(messages: AssistantMessage[]) {
  const priorUserMessages = [...messages]
    .reverse()
    .filter((message) => message.role === "user");

  for (const message of priorUserMessages) {
    const topic = detectTopic(normalizePrompt(message.content));

    if (topic !== "general") {
      return topic;
    }
  }

  return "general";
}

function detectMessageClass(
  prompt: string,
  messages: AssistantMessage[],
  emotion: EmotionalTone
): MessageClass {
  if (isIdentityMetaPrompt(prompt)) {
    return "identity_meta";
  }

  if (isCasualPrompt(prompt)) {
    return "casual_social";
  }

  if (isFollowUpPrompt(prompt) && inferContextTopic(messages) !== "general") {
    return "follow_up_contextual";
  }

  if (detectTopic(prompt) !== "general") {
    return "product_domain";
  }

  if (emotion !== "neutral") {
    return "casual_social";
  }

  return "fallback_unknown";
}

function buildCasualReply(prompt: string, emotion: EmotionalTone) {
  if (prompt.includes("thank")) {
    return "You’re welcome. Happy to keep going whenever you want.";
  }

  if (
    prompt.includes("how are you") ||
    prompt.includes("how is your day") ||
    prompt.includes("how s your day")
  ) {
    return "Doing well. I’m in good shape and ready to dig into whatever you want to unpack.";
  }

  switch (emotion) {
    case "frustrated":
      return "I get why that’s frustrating. If you want, tell me what feels off and we’ll clean it up together.";
    case "confused":
      return "Yeah, I get why that feels confusing. Point me at the fuzzy part and I’ll break it down without the jargon.";
    case "excited":
      return "Nice. That’s actually a good sign. If you want, we can turn that energy into a clearer next move.";
    case "overwhelmed":
      return "Yeah, that can get messy fast. We can take it one piece at a time if you want.";
    case "skeptical":
      return "Fair. I’d want to pressure-test it too. Tell me what feels shaky and I’ll look at it with you.";
    default:
      return "Hey. I’m here. If you want product help, ask about signals, demand analysis, objections, messaging, positioning, competitors, or next steps.";
  }
}

function buildIdentityMetaReply(prompt: string) {
  if (
    prompt.includes("what can you help with") ||
    prompt.includes("what can you do") ||
    prompt.includes("how can you help") ||
    prompt.includes("what do you help with")
  ) {
    return "I’m best at turning the raw output into something usable. I can define signals, explain how the engine runs demand analysis, interpret buyer intent, surface objections, sharpen messaging or positioning, compare competitors, and help you decide what to test first.";
  }

  return `I’m ${ASSISTANT_NAME}. Think of me as the strategist sitting beside the engine. I’m here to help turn raw demand signals into a clearer next move.`;
}

function buildUnknownReply() {
  return "I may not be the right tool for every topic, but I’m very good with search demand, buyer intent, objections, messaging, positioning, competitor reads, and next-step strategy. If that’s where you want to go, I’m in.";
}

function buildFollowUpBridge(topic: Topic, seed: string) {
  const bridges: Record<Exclude<Topic, "general">, string[]> = {
    signal: [
      "Staying with the signal layer for a second:",
      "On the signal side:",
      "If we stay with the signal set,"
    ],
    analysis: [
      "On the engine side:",
      "Staying with the analysis flow:",
      "If we keep it on the mechanics,"
    ],
    intent: [
      "Staying with buyer intent for a second:",
      "On the intent side:",
      "If we keep the focus on buyer intent,"
    ],
    objection: [
      "On the objection side:",
      "Staying with the hesitation layer:",
      "If we keep it on objections,"
    ],
    messaging: [
      "On the messaging side:",
      "Staying with the angle for a second:",
      "If we keep it on the copy layer,"
    ],
    positioning: [
      "On the positioning side:",
      "Staying with market position for a second:",
      "If we keep it on positioning,"
    ],
    competition: [
      "On the competitor side:",
      "Staying with the comparison for a second:",
      "If we keep it on the market landscape,"
    ]
  };

  if (topic === "general") {
    return "";
  }

  return pickVariant(bridges[topic], seed);
}

function buildEmotionAcknowledgment(tone: EmotionalTone, seed: string) {
  const acknowledgments: Record<Exclude<EmotionalTone, "neutral">, string[]> = {
    frustrated: [
      "I get why that’s frustrating.",
      "Yeah, that would frustrate me too.",
      "Fair. That would get irritating fast."
    ],
    confused: [
      "I get why that feels confusing.",
      "Yeah, that can get messy fast.",
      "I’d be asking the same thing."
    ],
    excited: [
      "That’s actually a good sign.",
      "Nice. That usually means something real is showing up.",
      "Good. That’s the kind of reaction you want."
    ],
    overwhelmed: [
      "Yeah, that can get overwhelming fast.",
      "Fair. There’s a lot going on there.",
      "That makes sense. It can feel like too much all at once."
    ],
    skeptical: [
      "That’s a fair thing to question.",
      "I’d be skeptical too if the signal felt thin.",
      "Fair. You want proof before you trust the read."
    ],
    curious: [
      "Good question.",
      "That’s worth unpacking.",
      "Yeah, that’s the right question."
    ]
  };

  if (tone === "neutral") {
    return "";
  }

  return pickVariant(acknowledgments[tone], seed);
}

function maybeAddCloser(
  messageClass: MessageClass,
  topic: Topic,
  seed: string
) {
  if (messageClass !== "product_domain" && messageClass !== "follow_up_contextual") {
    return "";
  }

  const closers = [
    "If you want, I can make that more tactical.",
    "If you want, we can apply that to your actual market.",
    "If you want, I can help turn that into a concrete test."
  ];

  if (hashText(`${seed}:${topic}`) % 3 === 0) {
    return pickVariant(closers, `${seed}:${topic}:closer`);
  }

  return "";
}

function applyVoice(
  baseReply: string,
  options: {
    normalizedPrompt: string;
    emotion: EmotionalTone;
    messageClass: MessageClass;
    followUp: boolean;
    topic: Topic;
  }
) {
  const parts: string[] = [];

  if (
    options.messageClass === "product_domain" ||
    options.messageClass === "follow_up_contextual"
  ) {
    const acknowledgment = buildEmotionAcknowledgment(
      options.emotion,
      `${options.normalizedPrompt}:emotion`
    );

    if (acknowledgment) {
      parts.push(acknowledgment);
    }

    if (options.followUp) {
      const bridge = buildFollowUpBridge(
        options.topic,
        `${options.normalizedPrompt}:followup`
      );

      if (bridge) {
        parts.push(bridge);
      }
    }
  }

  parts.push(baseReply);

  const closer = maybeAddCloser(
    options.messageClass,
    options.topic,
    options.normalizedPrompt
  );

  if (closer) {
    parts.push(closer);
  }

  return parts.join(" ");
}

function buildDomainReply(
  normalizedPrompt: string,
  options?: {
    contextTopic?: Topic;
    preferInterpretation?: boolean;
    followUp?: boolean;
  }
) {
  const detectedForm = detectQuestionForm(normalizedPrompt);
  const form =
    options?.preferInterpretation && detectedForm === "general"
      ? "interpretation"
      : detectedForm;
  const detectedTopic = detectTopic(normalizedPrompt);
  const topic =
    detectedTopic === "general" ? options?.contextTopic ?? "general" : detectedTopic;
  const category = resolveResponseCategory(form, topic);

  switch (category) {
    case "definition_explanation":
      return buildDefinitionReply(topic);
    case "process_mechanism":
      return buildProcessReply(topic);
    case "interpretation":
      return buildInterpretationReply(topic);
    case "strategy_next_step":
      return buildStrategyReply(topic);
    case "objections":
      return buildObjectionReply();
    case "messaging_positioning":
      return buildMessagingPositioningReply(topic);
    case "competition_comparison":
      return buildCompetitionReply();
    default:
      return buildFallbackReply();
  }
}

function buildReply(input: string, messages: AssistantMessage[]) {
  const prompt = normalizePrompt(input);
  const emotion = detectEmotion(prompt);
  const contextTopic = inferContextTopic(messages);
  const messageClass = detectMessageClass(prompt, messages, emotion);

  switch (messageClass) {
    case "casual_social":
      return buildCasualReply(prompt, emotion);
    case "identity_meta":
      return buildIdentityMetaReply(prompt);
    case "follow_up_contextual": {
      const topic = contextTopic === "general" ? detectTopic(prompt) : contextTopic;
      return applyVoice(
        buildDomainReply(prompt, {
          contextTopic,
          preferInterpretation: true,
          followUp: true
        }),
        {
          normalizedPrompt: prompt,
          emotion,
          messageClass,
          followUp: true,
          topic
        }
      );
    }
    case "product_domain": {
      const topic = detectTopic(prompt);
      return applyVoice(buildDomainReply(prompt), {
        normalizedPrompt: prompt,
        emotion,
        messageClass,
        followUp: false,
        topic
      });
    }
    default:
      return buildUnknownReply();
  }
}

function computeTypingDelay(prompt: string, reply: string) {
  const variance = hashText(`${prompt}:${reply}`) % 260;
  const lengthFactor = Math.min(900, Math.max(prompt.length * 7, reply.length * 1.35));

  return Math.min(2400, 900 + variance + lengthFactor);
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
    const conversationHistory = [...messages, userMessage];
    const assistantContent = buildReply(trimmed, conversationHistory);
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
                    <h3 className="intent-assistant-title" id={titleId}>
                      {ASSISTANT_NAME}
                    </h3>
                    <span className="intent-assistant-badge">{ASSISTANT_BADGE}</span>
                  </div>
                  <p className="intent-assistant-subtitle">
                    {ASSISTANT_SUBTITLE}
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
