import { ASSISTANT_IDENTITY } from "@/lib/knowledge/definitions";
import { applyGuardrails } from "@/lib/knowledge/guardrails";
import { getMemory } from "@/lib/engine/memory";

function hashText(input: string) {
  return [...input].reduce((value, character) => value + character.charCodeAt(0), 0);
}

function pickVariant<T>(items: readonly T[], seed: string): T {
  return items[hashText(seed) % items.length];
}

function joinList(items: string[], max = items.length) {
  const selected = items.slice(0, max);

  if (!selected.length) {
    return "";
  }

  if (selected.length === 1) {
    return selected[0];
  }

  if (selected.length === 2) {
    return `${selected[0]} and ${selected[1]}`;
  }

  return `${selected.slice(0, -1).join(", ")}, and ${selected.at(-1)}`;
}

function stripTerminalPunctuation(value: string) {
  return value.trim().replace(/[.!?]+$/g, "");
}

function buildCasualResponse(knowledge: any, seed: string): string {
  if (/thank/.test(knowledge.conversation.promptUsed)) {
    return pickVariant<string>(
      knowledge.conversation.social.gratitude,
      `${seed}:gratitude`
    );
  }

  const opener = pickVariant<string>(
    knowledge.conversation.social.casual.status,
    `${seed}:status`
  );
  const question = pickVariant<string>(
    knowledge.conversation.social.casual.followUps,
    `${seed}:followup`
  );

  return `${opener} ${question}`;
}

function buildIdentityResponse(knowledge: any, input: string): string {
  if (/help|can you do|help with/.test(input.toLowerCase())) {
    return `${ASSISTANT_IDENTITY.identity.short} ${ASSISTANT_IDENTITY.identity.capabilitySummary}`;
  }

  return `${ASSISTANT_IDENTITY.identity.short} I help break down demand patterns and what to do next.`;
}

function buildEmotionalResponse(
  knowledge: any,
  emotion: string,
  topic: string,
  seed: string
): string {
  const emotionalLibrary =
    knowledge.conversation.social.emotional[emotion] ??
    knowledge.conversation.social.emotional.confused;
  const acknowledgment = pickVariant<string>(emotionalLibrary, `${seed}:emotion`);

  if (topic === "general") {
    return `${acknowledgment} Tell me where it feels off and I’ll help untangle it.`;
  }

  return `${acknowledgment} Point me at the ${topic} part and I’ll break it down in a cleaner way.`;
}

function buildDefinitionResponse(knowledge: any, seed: string): string {
  const { definition, intentLevels, signals } = knowledge.conversation;
  const parts = [
    `${definition.label} is ${stripTerminalPunctuation(definition.description).replace(/^./, (value) => value.toLowerCase())}`,
    `What I look for: ${joinList(definition.lookFor, 3)}`,
    `Why it matters: ${stripTerminalPunctuation(definition.whyItMatters[0])}`
  ];

  if (definition.label === "Buyer intent") {
    parts.push(
      `Useful levels are ${joinList(
        Object.values(intentLevels).map((level: any) => `${level.label.toLowerCase()} (${level.description.toLowerCase()})`),
        3
      )}`
    );
  }

  if (signals[0]) {
    parts.push(
      `Example: "${signals[0].query}" reads as ${signals[0].stage} stage from ${signals[0].source}`
    );
  }

  return parts.join(". ") + ".";
}

function buildProcessResponse(knowledge: any): string {
  const { definition } = knowledge.conversation;
  const steps = definition.workflow ?? [];
  const outputs = definition.outputs ?? [];

  return [
    `${definition.label} works in passes: ${joinList(steps, 5)}`,
    `The output layer usually includes ${joinList(outputs, 4)}`
  ].join(". ") + ".";
}

function buildInterpretationResponse(knowledge: any, topic: string): string {
  const { interpretation, signals } = knowledge.conversation;
  const example = signals[0];
  const parts = [
    `The clean way to read this is ${joinList(interpretation.readOrder, 3)}`,
    `Watch for ${joinList(interpretation.watchFor, 3)}`,
    interpretation.means[0]
  ];

  if (example) {
    parts.push(
      `For example, "${example.query}" usually signals ${example.intent} at the ${example.stage} stage`
    );
  }

  if (topic === "intent") {
    parts.push(
      "When pricing, alternatives, or implementation questions repeat, the market is usually moving closer to a decision"
    );
  }

  return parts.join(". ") + ".";
}

function buildStrategyResponse(knowledge: any, topic: string, seed: string): string {
  const { topicStrategy, strategyRules, exampleQueries } = knowledge.conversation;
  const exampleQuery = pickVariant<string>(exampleQueries, `${seed}:example-query`);

  return [
    `${strategyRules.prioritize.description}`,
    `${topicStrategy.firstMove}`,
    `A clean validation sequence is to ${joinList(strategyRules.validation.steps, 2)}`,
    `A practical first test here would be around a query pattern like "${exampleQuery}"`
  ].join(". ") + ".";
}

function buildComparisonResponse(knowledge: any): string {
  const { interpretation, topicStrategy } = knowledge.conversation;

  return [
    `Use the competitor read to compare ${joinList(interpretation.readOrder, 3)}`,
    interpretation.means[1],
    `Then test the contrast by ${joinList(topicStrategy.tests, 2)}`
  ].join(". ") + ".";
}

function buildDeeperStrategyFollowUp(knowledge: any): string {
  const { topicStrategy, strategyRules } = knowledge.conversation;

  return [
    `${topicStrategy.firstMove}`,
    `The next useful layer is ${joinList(topicStrategy.tests, 2)}`,
    `Keep the test narrow enough to learn fast, which is why you should ${strategyRules.nextStep.steps[1]}`
  ].join(". ") + ".";
}

function buildFollowUpResponse(knowledge: any, topic: string, seed: string): string {
  const memory = getMemory();
  const bridge = pickVariant<string>(
    knowledge.conversation.social.followUpBridges[topic] ??
      knowledge.conversation.social.followUpBridges.general,
    `${seed}:bridge`
  );

  if (memory.lastExplanation === "definition") {
    return `${bridge} ${buildInterpretationResponse(knowledge, topic)}`;
  }

  if (memory.lastExplanation === "interpretation") {
    return `${bridge} ${buildStrategyResponse(knowledge, topic, seed)}`;
  }

  if (memory.lastExplanation === "strategy") {
    return `${bridge} ${buildDeeperStrategyFollowUp(knowledge)}`;
  }

  return `${bridge} ${buildInterpretationResponse(knowledge, topic)}`;
}

function buildDomainResponse(knowledge: any, topic: string, mode: string, seed: string) {
  if (mode === "definition") {
    return buildDefinitionResponse(knowledge, seed);
  }

  if (mode === "process") {
    return buildProcessResponse(knowledge);
  }

  if (mode === "interpretation") {
    return buildInterpretationResponse(knowledge, topic);
  }

  if (mode === "strategy") {
    return buildStrategyResponse(knowledge, topic, seed);
  }

  if (mode === "comparison") {
    return buildComparisonResponse(knowledge);
  }

  return buildInterpretationResponse(knowledge, topic);
}

type ComposeInput = {
  input: string;
  type: "casual" | "identity" | "emotional" | "follow_up" | "domain";
  topic: string;
  emotion: string;
  knowledge: any;
};

export function composeResponse({ input, type, topic, emotion, knowledge }: ComposeInput) {
  const seed = `${input}:${topic}:${knowledge.mode}`;
  const memory = getMemory();
  let rawResponse = "";

  if (type === "casual") {
    rawResponse = buildCasualResponse(knowledge, seed);
  } else if (type === "identity") {
    rawResponse = buildIdentityResponse(knowledge, input);
  } else if (type === "emotional") {
    rawResponse = buildEmotionalResponse(knowledge, emotion, topic, seed);
  } else if (type === "follow_up" && memory.lastTopic) {
    rawResponse = buildFollowUpResponse(knowledge, topic, seed);
  } else {
    rawResponse = buildDomainResponse(knowledge, topic, knowledge.mode, seed);
  }

  return applyGuardrails(rawResponse, { type, topic });
}
