export type MessageType = "casual" | "identity" | "emotional" | "follow_up" | "domain";

export type EmotionalTone =
  | "frustrated"
  | "confused"
  | "excited"
  | "overwhelmed"
  | "skeptical"
  | "curious"
  | "neutral";

export function normalizeMessage(input: string) {
  return input.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function detectEmotion(input: string): EmotionalTone {
  const msg = normalizeMessage(input);

  if (/frustrating|annoying|broken|stuck|hate this|not working/.test(msg)) {
    return "frustrated";
  }

  if (/confusing|confused|unclear|doesn t make sense|do not get|dont get/.test(msg)) {
    return "confused";
  }

  if (/awesome|excited|love this|amazing|this is great/.test(msg)) {
    return "excited";
  }

  if (/overwhelmed|too much|messy|all over the place/.test(msg)) {
    return "overwhelmed";
  }

  if (/skeptical|not convinced|sounds fake|sounds wrong|seems off/.test(msg)) {
    return "skeptical";
  }

  if (/^why\b|^how\b|curious|wondering/.test(msg)) {
    return "curious";
  }

  return "neutral";
}

export function classifyMessage(input: string): MessageType {
  const msg = normalizeMessage(input);

  if (/^(hey|hi|hello|yo)\b|how.*going|what s up|good morning|good afternoon|good evening|thanks|thank you/.test(msg)) {
    return "casual";
  }

  if (/your name|who are you|what are you|what can you help with|what can you do|how can you help/.test(msg)) {
    return "identity";
  }

  if (/frustrating|confusing|doesn t work|not working|stuck|overwhelmed|skeptical|excited|awesome/.test(msg)) {
    return "emotional";
  }

  if (/go deeper|what about that|second one|which of those|go deeper on that|what about the second/.test(msg)) {
    return "follow_up";
  }

  return "domain";
}

export function detectQuestionMode(
  input: string,
  type: MessageType,
  lastExplanation: string | null
) {
  const msg = normalizeMessage(input);

  if (type === "casual") {
    return "casual";
  }

  if (type === "identity") {
    return "identity";
  }

  if (type === "emotional") {
    return "emotional";
  }

  if (type === "follow_up") {
    if (/which|test|should|next|first/.test(msg)) {
      return "strategy";
    }

    if (lastExplanation === "casual" || lastExplanation === "identity" || lastExplanation === "emotional") {
      return "interpretation";
    }

    if (lastExplanation === "definition") {
      return "interpretation";
    }

    if (lastExplanation === "interpretation") {
      return "strategy";
    }

    return lastExplanation ?? "interpretation";
  }

  if (/^what is\b|^what are\b|^define\b|^explain\b/.test(msg)) {
    return "definition";
  }

  if (/^how does\b|^how do\b|engine work|run demand analysis|pipeline|workflow/.test(msg)) {
    return "process";
  }

  if (/^what do .* mean\b|^what does .* mean\b|how do i interpret|what does this mean/.test(msg)) {
    return "interpretation";
  }

  if (/^which\b|^what should\b|^where should i start\b|test first|next step|what do i do/.test(msg)) {
    return "strategy";
  }

  if (/competitor|compare|comparison|vs|versus|alternative/.test(msg)) {
    return "comparison";
  }

  return "domain";
}
