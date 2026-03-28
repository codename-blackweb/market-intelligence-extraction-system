export type Signal = {
  query: string;
  source: "autocomplete" | "paa" | "related";
  intent: string;
  stage: string;
  modifiers: string[];
};

export const SIGNAL_DATASET: Signal[] = [
  {
    query: "why am I not getting customers",
    source: "autocomplete",
    intent: "problem discovery",
    stage: "problem",
    modifiers: ["friction", "urgency", "revenue pressure"]
  },
  {
    query: "best tools for lead generation",
    source: "paa",
    intent: "solution exploration",
    stage: "solution",
    modifiers: ["tool search", "comparison", "solution framing"]
  },
  {
    query: "is this crm worth it",
    source: "related",
    intent: "risk reduction",
    stage: "evaluation",
    modifiers: ["pricing concern", "trust", "value check"]
  },
  {
    query: "crm alternatives for small teams",
    source: "related",
    intent: "active comparison",
    stage: "evaluation",
    modifiers: ["alternatives", "switching", "fit"]
  },
  {
    query: "how long does onboarding take for sales software",
    source: "paa",
    intent: "implementation concern",
    stage: "decision",
    modifiers: ["effort", "time-to-value", "risk"]
  },
  {
    query: "lead generation agency pricing",
    source: "autocomplete",
    intent: "commercial evaluation",
    stage: "decision",
    modifiers: ["pricing", "budget", "vendor selection"]
  }
];

export const QUERY_EXAMPLES = {
  signals: [
    "why am I not getting customers",
    "best tools for lead generation",
    "is this crm worth it",
    "crm alternatives for small teams"
  ],
  intent: [
    "lead generation agency pricing",
    "crm alternatives for small teams",
    "is this crm worth it"
  ],
  objections: [
    "how long does onboarding take for sales software",
    "is this crm worth it"
  ],
  messaging: [
    "why am I not getting customers",
    "best tools for lead generation"
  ],
  competition: [
    "crm alternatives for small teams",
    "best tools for lead generation"
  ],
  strategy: [
    "lead generation agency pricing",
    "crm alternatives for small teams"
  ]
} as const;

export const SOCIAL_RESPONSES = {
  casual: {
    status: [
      "Pretty good.",
      "Doing well.",
      "Solid so far."
    ],
    followUps: [
      "What are you looking at right now?",
      "What are you trying to figure out?",
      "What part do you want to unpack?"
    ]
  },
  gratitude: [
    "Anytime.",
    "Of course.",
    "Happy to help."
  ],
  emotional: {
    frustrated: [
      "Yeah, I get why that’s frustrating.",
      "Fair. That would get old fast.",
      "I can see why that’s irritating."
    ],
    confused: [
      "Yeah, that can get messy fast.",
      "I get why that feels confusing.",
      "I’d be asking the same thing."
    ],
    excited: [
      "That’s actually a good sign.",
      "Nice. That usually means something real is showing up.",
      "Good. That kind of reaction matters."
    ],
    overwhelmed: [
      "That makes sense. There’s a lot there.",
      "Yeah, that can feel like a lot at once.",
      "Fair. We can simplify it."
    ],
    skeptical: [
      "Fair. You want proof before you buy the read.",
      "That’s a reasonable reaction.",
      "I’d pressure-test it too."
    ],
    curious: [
      "Good question.",
      "That’s worth unpacking.",
      "Yeah, that’s the right place to look."
    ]
  },
  followUpBridges: {
    signal: [
      "Staying with the signal side:",
      "If we keep it on signals:",
      "Going one layer deeper on the signal read:"
    ],
    intent: [
      "Staying with buyer intent:",
      "If we keep the focus on intent:",
      "Going one layer deeper on intent:"
    ],
    objection: [
      "Staying with objections:",
      "If we keep it on hesitation:",
      "Going one layer deeper on friction:"
    ],
    messaging: [
      "Staying with the messaging angle:",
      "If we keep it on the message side:",
      "Going one layer deeper on the angle:"
    ],
    positioning: [
      "Staying with positioning:",
      "If we keep it on market position:",
      "Going one layer deeper on the frame:"
    ],
    competition: [
      "Staying with the competitor read:",
      "If we keep it on the market landscape:",
      "Going one layer deeper on the comparison:"
    ],
    analysis: [
      "Staying with how the engine works:",
      "If we keep it on the workflow:",
      "Going one layer deeper on the analysis flow:"
    ],
    strategy: [
      "Staying with the next move:",
      "If we keep it on testing:",
      "Going one layer deeper on strategy:"
    ],
    general: [
      "Staying with that:",
      "If we keep going on that thread:",
      "Going one layer deeper:"
    ]
  },
  fallbackPrompts: [
    "If you want, ask about signals, intent, objections, strategy, competitors, or how the engine works.",
    "If you want, point me at the pattern or decision you’re trying to make.",
    "If you want, I can break it down from a demand, intent, or strategy angle."
  ]
} as const;
