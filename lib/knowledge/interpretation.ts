export const INTERPRETATION_RULES = {
  high_intent: {
    label: "High intent",
    description:
      "Presence of pricing, comparisons, alternatives, or implementation language indicates strong decision proximity.",
    markers: ["pricing", "alternatives", "compare", "reviews", "worth it"]
  },
  low_intent: {
    label: "Low intent",
    description:
      "Broad, educational, or exploratory queries indicate early-stage curiosity.",
    markers: ["what is", "how does", "guide", "tips", "ideas"]
  },
  friction_signal: {
    label: "Friction signal",
    description:
      "Repeated hesitation language indicates conversion resistance.",
    markers: ["too expensive", "hard to use", "takes too long", "can I trust it"]
  },
  byTopic: {
    signal: {
      readOrder: [
        "start with repetition",
        "check whether the wording is pain-led or decision-led",
        "separate curiosity from decision pressure"
      ],
      watchFor: [
        "persistent problem wording",
        "comparison language",
        "hesitation patterns"
      ],
      means: [
        "Repeated pain language usually means the market is actively struggling.",
        "Repeated comparison language usually means the market is narrowing options."
      ]
    },
    intent: {
      readOrder: [
        "locate the stage first",
        "check for risk-reduction language",
        "see whether urgency is rising"
      ],
      watchFor: [
        "pricing questions",
        "switching or setup language",
        "alternatives or worth-it phrasing"
      ],
      means: [
        "The closer the query is to choosing, the stronger the intent signal.",
        "When risk-reduction language repeats, buyers are trying to get comfortable enough to act."
      ]
    },
    objection: {
      readOrder: [
        "group the objections",
        "find the repeated risk",
        "connect the objection back to the point in the journey"
      ],
      watchFor: ["trust concerns", "cost pressure", "effort concerns", "time-to-value doubts"],
      means: [
        "Objections usually tell you where the current message is not answering enough.",
        "They often map directly to the next thing your positioning or proof has to solve."
      ]
    },
    messaging: {
      readOrder: [
        "pull the raw buyer phrase",
        "keep the pressure point intact",
        "frame the promise around risk reduction or speed"
      ],
      watchFor: ["pain verbs", "desired outcomes", "trust language"],
      means: [
        "The best angle usually sounds like the market talking to itself.",
        "If the wording feels too polished, it usually drifts away from the signal."
      ]
    },
    positioning: {
      readOrder: [
        "find the urgent cluster",
        "see how the market frames it today",
        "look for the pressure point competitors leave exposed"
      ],
      watchFor: ["overused promises", "weak proof", "under-addressed objections"],
      means: [
        "A usable position comes from contrast around a real pain point.",
        "If the contrast is not tied to real buyer pressure, it is probably just branding."
      ]
    },
    competition: {
      readOrder: [
        "compare promises",
        "compare proof",
        "compare what gets ignored"
      ],
      watchFor: ["repeated claims", "shared framing", "missing objections"],
      means: [
        "If the market asks for something competitors barely answer, that is usually the opening.",
        "If everyone sounds the same, the next move is usually a sharper frame, not louder copy."
      ]
    },
    analysis: {
      readOrder: [
        "start with the strongest cluster",
        "read the language pattern",
        "then look at intent, objections, and competitor framing"
      ],
      watchFor: ["dominant pain themes", "decision-stage wording", "friction patterns"],
      means: [
        "The analysis means more when the same pressure shows up across multiple sources.",
        "You want consistency, not one isolated spike."
      ]
    }
  }
} as const;
