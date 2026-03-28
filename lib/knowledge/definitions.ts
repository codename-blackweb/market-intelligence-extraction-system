export const ASSISTANT_IDENTITY = {
  name: "Signal",
  title: "GUIDE",
  subtitle: "IntentEngine Strategy Guide",
  greeting: {
    opener: "Hey, I’m Signal.",
    purpose:
      "I help make sense of demand patterns, buyer intent, objections, and what to do next.",
    question: "What are you looking at?"
  },
  identity: {
    short: "I’m Signal.",
    role: "I’m here to break down demand patterns and what to do next.",
    capabilitySummary:
      "I can help define signals, explain how the engine works, interpret what patterns mean, and turn the output into strategy."
  }
} as const;

export const DEFINITIONS = {
  demand_signal: {
    label: "Demand signal",
    description:
      "A repeatable search behavior that reveals a market need, decision point, or friction.",
    lookFor: [
      "repeated problem wording",
      "queries that mention outcomes or urgency",
      "phrases that keep showing up across sources"
    ],
    whyItMatters: [
      "It helps separate noise from real demand.",
      "It tells you where buyers are leaning in or getting stuck."
    ]
  },
  buyer_intent: {
    label: "Buyer intent",
    description:
      "How close a user is to making a decision, inferred from query patterns like comparisons, pricing, or alternatives.",
    lookFor: [
      "comparison language",
      "pricing or worth-it questions",
      "implementation or switching concerns"
    ],
    whyItMatters: [
      "It tells you whether the market is exploring or deciding.",
      "It helps you prioritize messaging and tests."
    ]
  },
  objection_signal: {
    label: "Objection signal",
    description:
      "Language that indicates hesitation, risk, or resistance around buying or switching.",
    lookFor: [
      "questions about cost, trust, effort, or time",
      "phrases like worth it, scam, hard to use, or too expensive",
      "queries that compare risk across alternatives"
    ],
    whyItMatters: [
      "Objections usually show you where conversion friction lives.",
      "They tell you what your message needs to answer before someone moves."
    ]
  },
  messaging_angle: {
    label: "Messaging angle",
    description:
      "A strategic framing derived from repeated buyer language patterns.",
    lookFor: [
      "the exact phrases people use when they describe pain",
      "desired outcomes that keep repeating",
      "risk-reduction language attached to the decision"
    ],
    whyItMatters: [
      "It keeps the message anchored to real buyer language.",
      "It gives you a sharper testable promise."
    ]
  },
  positioning_angle: {
    label: "Positioning angle",
    description:
      "A market-facing point of view that explains why this solution is the better fit for a specific pressure point.",
    lookFor: [
      "under-served pain clusters",
      "patterns competitors over-explain or ignore",
      "buyer language that signals a sharper category or promise"
    ],
    whyItMatters: [
      "It helps you differentiate around real demand instead of invented branding.",
      "It makes tests more precise."
    ]
  },
  demand_analysis: {
    label: "Demand analysis engine",
    description:
      "A structured pass that collects search demand, clusters repeated language, classifies the market, and turns that into usable strategy.",
    workflow: [
      "collect visible demand signals",
      "cluster repeated patterns",
      "classify intent, friction, and market context",
      "surface objections, language, and competitive pressure",
      "turn the read into next-step strategy"
    ],
    outputs: [
      "problems",
      "language patterns",
      "demand clusters",
      "competitor angles",
      "gaps",
      "recommended moves"
    ]
  },
  competitor_pattern: {
    label: "Competitor pattern",
    description:
      "A repeated framing, promise, or proof structure that shows how the market is already being sold to.",
    lookFor: [
      "claims competitors repeat",
      "what they emphasize first",
      "what they avoid or explain weakly"
    ],
    whyItMatters: [
      "It shows where the market is crowded.",
      "It also shows where there may be whitespace."
    ]
  }
} as const;

export const INTENT_LEVELS = {
  curiosity: {
    label: "Curiosity",
    description: "Early exploration and learning.",
    markers: ["broad questions", "educational wording", "what is style queries"]
  },
  problem: {
    label: "Problem",
    description: "Trying to understand or fix an issue.",
    markers: ["pain wording", "why is this happening", "how do I fix this"]
  },
  solution: {
    label: "Solution",
    description: "Exploring tools or approaches.",
    markers: ["best tools", "software for", "ways to solve"]
  },
  evaluation: {
    label: "Evaluation",
    description: "Comparing options and reducing risk.",
    markers: ["alternatives", "vs", "reviews", "worth it", "compare"]
  },
  decision: {
    label: "Decision",
    description: "Ready to act or purchase.",
    markers: ["pricing", "demo", "buy", "implementation timeline"]
  }
} as const;
