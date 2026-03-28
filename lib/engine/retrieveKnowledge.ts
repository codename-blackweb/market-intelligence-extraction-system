import { DEFINITIONS, INTENT_LEVELS } from "@/lib/knowledge/definitions";
import { QUERY_EXAMPLES, SIGNAL_DATASET, SOCIAL_RESPONSES } from "@/lib/knowledge/examples";
import { INTERPRETATION_RULES } from "@/lib/knowledge/interpretation";
import { STRATEGY_RULES, TOPIC_STRATEGIES } from "@/lib/knowledge/strategy";

type Topic =
  | "intent"
  | "signal"
  | "objection"
  | "messaging"
  | "positioning"
  | "competition"
  | "analysis"
  | "strategy"
  | "general";

type MessageType = "casual" | "identity" | "emotional" | "follow_up" | "domain";

type QuestionMode =
  | "casual"
  | "identity"
  | "emotional"
  | "definition"
  | "process"
  | "interpretation"
  | "strategy"
  | "comparison"
  | "domain";

type RetrievalInput = {
  input: string;
  type: MessageType;
  topic: Topic;
  mode: QuestionMode | string;
};

const TOPIC_TO_DEFINITION = {
  signal: DEFINITIONS.demand_signal,
  intent: DEFINITIONS.buyer_intent,
  objection: DEFINITIONS.objection_signal,
  messaging: DEFINITIONS.messaging_angle,
  positioning: DEFINITIONS.positioning_angle,
  competition: DEFINITIONS.competitor_pattern,
  analysis: DEFINITIONS.demand_analysis,
  strategy: DEFINITIONS.messaging_angle,
  general: DEFINITIONS.demand_analysis
} as const;

export function retrieveKnowledge({ input, type, topic, mode }: RetrievalInput) {
  const normalized = input.toLowerCase();
  const definition = TOPIC_TO_DEFINITION[topic] ?? DEFINITIONS.demand_analysis;
  const interpretationKey =
    topic === "strategy"
      ? "analysis"
      : topic === "general"
        ? "analysis"
        : topic;
  const interpretation =
    INTERPRETATION_RULES.byTopic[interpretationKey] ??
    INTERPRETATION_RULES.byTopic.analysis;
  const strategy =
    TOPIC_STRATEGIES[topic] ?? TOPIC_STRATEGIES.general;
  const signals = SIGNAL_DATASET.filter((signal) => {
    if (topic === "signal") return true;
    if (topic === "intent") return ["evaluation", "decision"].includes(signal.stage);
    if (topic === "objection") return signal.modifiers.some((modifier) => /risk|trust|pricing|effort|time/.test(modifier));
    if (topic === "competition") return signal.modifiers.some((modifier) => /comparison|alternatives|switching|vendor/.test(modifier));
    if (topic === "strategy") return ["evaluation", "decision"].includes(signal.stage);
    if (topic === "analysis") return true;

    return signal.stage === "problem";
  }).slice(0, 3);

  const exampleKey =
    topic === "signal"
      ? "signals"
      : topic === "objection"
        ? "objections"
        : topic === "positioning"
          ? "messaging"
          : topic === "analysis"
            ? "signals"
            : topic === "general"
              ? "signals"
              : topic;
  const exampleQueries =
    QUERY_EXAMPLES[exampleKey] ??
    QUERY_EXAMPLES.signals;

  const conversation = {
    social: SOCIAL_RESPONSES,
    intentLevels: INTENT_LEVELS,
    definition,
    interpretation,
    topicStrategy: strategy,
    strategyRules: STRATEGY_RULES,
    signals,
    exampleQueries,
    promptUsed: normalized
  };

  const knowledgeKeys = [
    `definition:${definition.label}`,
    `interpretation:${topic}`,
    `strategy:${topic}`,
    ...signals.map((signal) => `signal:${signal.query}`)
  ];

  if (type === "identity") {
    knowledgeKeys.unshift("identity:assistant");
  }

  if (type === "casual" || type === "emotional") {
    knowledgeKeys.unshift(`conversation:${type}`);
  }

  if (mode === "comparison") {
    knowledgeKeys.unshift("comparison:market-landscape");
  }

  return {
    mode,
    topic,
    conversation,
    knowledgeKeys
  };
}
