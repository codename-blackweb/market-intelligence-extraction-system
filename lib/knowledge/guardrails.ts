export const GUARDRAILS = {
  noFabrication: true,
  noFalseCertainty: true,
  noGenericFiller: true,
  noOffTopic: true
} as const;

type GuardrailContext = {
  type: "casual" | "identity" | "emotional" | "follow_up" | "domain";
  topic: string;
};

const ABSOLUTE_LANGUAGE = [
  { from: /\balways\b/gi, to: "usually" },
  { from: /\bnever\b/gi, to: "rarely" },
  { from: /\bdefinitely\b/gi, to: "very likely" },
  { from: /\bguarantee\b/gi, to: "improve the odds of" }
];

export function applyGuardrails(response: string, context: GuardrailContext) {
  let safe = response.replace(/\s+/g, " ").trim();
  safe = safe.replace(/\.{2,}/g, ".");

  if (GUARDRAILS.noGenericFiller) {
    safe = safe
      .replace(/\bI specialize in\b/gi, "I can help with")
      .replace(/\bAs an AI\b/gi, "")
      .replace(/\bIn conclusion[, ]*/gi, "");
  }

  if (GUARDRAILS.noFalseCertainty) {
    for (const rule of ABSOLUTE_LANGUAGE) {
      safe = safe.replace(rule.from, rule.to);
    }
  }

  if (GUARDRAILS.noOffTopic && context.type === "casual") {
    safe = safe.replace(
      /\b(demand analysis|market intelligence engine|buyer intent model)\b/gi,
      "what you are looking at"
    );
  }

  if (!/[.!?]$/.test(safe)) {
    safe += ".";
  }

  return safe;
}
