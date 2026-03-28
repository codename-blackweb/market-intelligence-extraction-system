export const STRATEGY_RULES = {
  prioritize: {
    label: "Prioritize",
    description: "Start with clusters that show high intent and high friction.",
    steps: [
      "find the cluster with the clearest decision language",
      "check whether objections repeat around it",
      "test the angle that removes the biggest hesitation"
    ]
  },
  messaging: {
    label: "Messaging",
    description: "Use repeated buyer language as the foundation for messaging.",
    steps: [
      "pull the exact pain phrasing",
      "keep the pressure point intact",
      "pair it with the outcome buyers want"
    ]
  },
  validation: {
    label: "Validation",
    description: "Test messaging directly against real query patterns.",
    steps: [
      "turn the strongest cluster into one focused message",
      "run it in a landing page, ad, or outbound test",
      "watch response quality, not just click volume"
    ]
  },
  nextStep: {
    label: "Next step",
    description: "Pick one move that turns insight into a concrete experiment.",
    steps: [
      "choose the strongest signal",
      "attach the clearest message angle",
      "measure whether the response quality improves"
    ]
  }
} as const;

export const TOPIC_STRATEGIES = {
  signal: {
    firstMove: "Start with the cluster that repeats across sources and carries the clearest decision pressure.",
    tests: [
      "turn the strongest signal into a headline test",
      "build one page or ad around the exact wording",
      "watch whether the market responds to the sharper promise"
    ]
  },
  intent: {
    firstMove: "Lead with the highest-intent pattern first because it is closest to action.",
    tests: [
      "test a message around pricing clarity or risk reduction",
      "compare a solution-aware page against a decision-aware page",
      "see whether the more specific frame improves conversion quality"
    ]
  },
  objection: {
    firstMove: "Answer the biggest repeated hesitation before you add more persuasion.",
    tests: [
      "add a proof block that addresses the top objection",
      "reframe the offer around the risk buyers are trying to avoid",
      "test a version that handles cost, trust, or effort directly"
    ]
  },
  messaging: {
    firstMove: "Use the repeated buyer phrase as the lead, not the polished brand phrase.",
    tests: [
      "swap in the raw pain wording",
      "test a speed angle versus a certainty angle",
      "keep the copy close to the language pattern you found"
    ]
  },
  positioning: {
    firstMove: "Position around the pain competitors leave exposed.",
    tests: [
      "test a frame that solves the under-addressed tension",
      "compare the current category language against a sharper point of view",
      "see whether the new frame improves message clarity"
    ]
  },
  competition: {
    firstMove: "Use the competitive read to find the whitespace, then test the contrast.",
    tests: [
      "test the claim competitors underplay",
      "tighten proof where competitors stay vague",
      "differentiate on the risk or outcome the market still cares about"
    ]
  },
  analysis: {
    firstMove: "Use the analysis to narrow the field to one cluster worth pressure-testing now.",
    tests: [
      "take the dominant cluster into one focused experiment",
      "test message clarity before expanding channels",
      "let the signal decide where to go deeper"
    ]
  },
  strategy: {
    firstMove: "Use the strongest cluster as the anchor, then choose one test that tightens the next decision.",
    tests: [
      "run one message test against the clearest cluster",
      "keep the experiment narrow enough to learn something real",
      "use the response quality to decide whether to deepen or reposition"
    ]
  },
  general: {
    firstMove: "Start with the cluster that looks both urgent and decision-adjacent.",
    tests: [
      "run one focused message test",
      "keep the frame anchored to the strongest pressure point",
      "use results to decide whether to deepen or reposition"
    ]
  }
} as const;
