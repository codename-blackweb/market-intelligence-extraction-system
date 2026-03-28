export type Topic =
  | "intent"
  | "signal"
  | "objection"
  | "messaging"
  | "positioning"
  | "competition"
  | "analysis"
  | "strategy"
  | "general";

export function detectTopic(input: string, fallbackTopic?: string | null): Topic {
  const msg = input.toLowerCase();

  if (msg.includes("buyer intent") || msg.includes("intent")) return "intent";
  if (msg.includes("signal") || msg.includes("pattern") || msg.includes("cluster")) return "signal";
  if (msg.includes("objection") || msg.includes("hesitation") || msg.includes("friction")) return "objection";
  if (msg.includes("message") || msg.includes("headline") || msg.includes("angle")) return "messaging";
  if (msg.includes("position") || msg.includes("differentiat")) return "positioning";
  if (msg.includes("competitor") || msg.includes("comparison") || msg.includes("versus") || msg.includes("vs") || msg.includes("alternative")) return "competition";
  if (msg.includes("engine") || msg.includes("analysis") || msg.includes("workflow") || msg.includes("pipeline")) return "analysis";
  if (msg.includes("test") || msg.includes("strategy") || msg.includes("next step")) return "strategy";

  if (fallbackTopic && fallbackTopic !== "general") {
    return fallbackTopic as Topic;
  }

  return "general";
}
