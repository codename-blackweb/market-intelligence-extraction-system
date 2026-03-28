import { classifyMessage, detectEmotion, detectQuestionMode } from "@/lib/engine/classifyMessage";
import { composeResponse } from "@/lib/engine/composeResponse";
import { detectTopic } from "@/lib/engine/detectTopic";
import { getMemory, resetMemory, seedMemory, updateMemory } from "@/lib/engine/memory";
import { retrieveKnowledge } from "@/lib/engine/retrieveKnowledge";
import { ASSISTANT_IDENTITY } from "@/lib/knowledge/definitions";

export function getAssistantProfile() {
  return {
    name: ASSISTANT_IDENTITY.name,
    badge: ASSISTANT_IDENTITY.title,
    subtitle: ASSISTANT_IDENTITY.subtitle
  };
}

export function getInitialAssistantMessage() {
  const greeting = [
    ASSISTANT_IDENTITY.greeting.opener,
    ASSISTANT_IDENTITY.greeting.purpose,
    ASSISTANT_IDENTITY.greeting.question
  ].join(" ");

  seedMemory(greeting);
  return greeting;
}

export function resetAssistantSession() {
  resetMemory();
  seedMemory(getInitialAssistantMessage());
}

function runResponsePipeline(input: string) {
  const memory = getMemory();
  const type = classifyMessage(input);
  const emotion = detectEmotion(input);
  const topic =
    type === "domain" || type === "follow_up"
      ? detectTopic(input, memory.lastTopic)
      : detectTopic(input, null);
  const mode = detectQuestionMode(input, type, memory.lastExplanation);
  const knowledge = retrieveKnowledge({ input, type, topic, mode });
  const response = composeResponse({
    input,
    type,
    topic,
    emotion,
    knowledge
  });

  return {
    response,
    type,
    topic,
    mode: knowledge.mode,
    knowledgeKeys: knowledge.knowledgeKeys
  };
}

export function generateResponse(input: string) {
  const result = runResponsePipeline(input);
  const preserveContext =
    result.type === "casual" || result.type === "identity" || result.type === "emotional";

  updateMemory(
    input,
    result.response,
    result.topic,
    result.mode,
    result.knowledgeKeys,
    { preserveContext }
  );

  return result.response;
}

export function generateResponseWithTrace(input: string) {
  const result = runResponsePipeline(input);
  const preserveContext =
    result.type === "casual" || result.type === "identity" || result.type === "emotional";

  updateMemory(
    input,
    result.response,
    result.topic,
    result.mode,
    result.knowledgeKeys,
    { preserveContext }
  );

  return {
    ...result,
    memory: {
      ...getMemory(),
      lastMessages: [...getMemory().lastMessages],
      lastKnowledgeKeys: [...getMemory().lastKnowledgeKeys]
    }
  };
}

export function computeTypingDelay(prompt: string, reply: string) {
  const variance = [...`${prompt}:${reply}`].reduce(
    (value, character) => value + character.charCodeAt(0),
    0
  ) % 260;
  const lengthFactor = Math.min(900, Math.max(prompt.length * 7, reply.length * 1.35));

  return Math.min(2400, 900 + variance + lengthFactor);
}
