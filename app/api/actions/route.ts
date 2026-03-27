import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type {
  GeneratedActionsResponse,
  GeneratedActionKind,
  MarketAnalysisSuccessResponse
} from "@/types/market-analysis";

type ActionRequestBody = {
  kind?: GeneratedActionKind;
  analysis?: MarketAnalysisSuccessResponse;
};

function safeParse<T>(value: string) {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function extractOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const response = payload as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };

  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  return (
    response.output
      ?.flatMap((item) => item.content ?? [])
      .filter((item) => item.type === "output_text" || item.type === "text")
      .map((item) => item.text ?? "")
      .join("\n")
      .trim() ?? ""
  );
}

function buildDeterministicOutputs(
  kind: GeneratedActionKind,
  analysis: MarketAnalysisSuccessResponse
) {
  const query = analysis.query;
  const constraint = analysis.strategy.core_constraint;
  const move = analysis.recommended_move;
  const emphasize = analysis.positioning_strategy.emphasize[0] || "predictable acquisition";
  const message = analysis.strategy.messaging;
  const narrative = analysis.dominant_narrative;

  switch (kind) {
    case "positioning_statement":
      return [
        `For teams navigating ${constraint.toLowerCase()}, this system turns live market demand into ${emphasize.toLowerCase()} and usable strategic direction.`,
        `Built for operators who need clarity, not hype, it converts visible demand around ${query} into decisions the team can act on immediately.`,
        `Use it to replace vague growth promises with a defensible position rooted in ${message.toLowerCase()}.`
      ];
    case "ad_angles":
      return [
        `Stop guessing where growth stalls. See the live demand patterns shaping your next move.`,
        `If acquisition feels unpredictable, diagnose the market before you spend another dollar.`,
        `Turn noisy search demand into a positioning edge your competitors still cannot explain.`
      ];
    case "landing_page_hook":
      return [
        `See the market pattern before you write the next headline.`,
        `Demand is already telling you what is broken. This system shows you how to use it.`,
        `From ${query} to a clearer strategic move in one auditable intelligence flow.`
      ];
    case "email_angle":
      return [
        `Subject: The market signal your competitors are still missing`,
        `Subject: Why demand feels active but growth still stalls`,
        `Subject: A clearer way to turn search noise into positioning`
      ];
    default:
      return [move || narrative];
  }
}

async function runLiveGeneration(
  kind: GeneratedActionKind,
  analysis: MarketAnalysisSuccessResponse
) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_ACTIONS_MODEL || process.env.OPENAI_SYNTHESIS_MODEL;

  if (!apiKey || !model) {
    throw new Error("Missing action generation configuration.");
  }

  const client = new OpenAI({ apiKey });

  const prompt = `
You are a senior positioning strategist.

Generate concise, high-signal outputs in JSON only.

Return this exact shape:
{
  "outputs": ["", "", ""]
}

Kind:
${kind}

Analysis:
${JSON.stringify(analysis, null, 2)}

Rules:
- Outputs must be immediately usable.
- No filler.
- No markdown.
- No numbering.
- Keep each output short.
`;

  const response = await client.responses.create({
    model,
    input: prompt
  });

  const parsed = safeParse<{ outputs?: string[] }>(extractOutputText(response));

  if (!parsed?.outputs?.length) {
    throw new Error("Invalid action output JSON.");
  }

  return parsed.outputs.filter((item): item is string => typeof item === "string").slice(0, 4);
}

export async function POST(request: NextRequest) {
  try {
    const MODE = (process.env.MODE || "DEV").toUpperCase();
    const { kind, analysis } = (await request.json()) as ActionRequestBody;

    if (!kind || !analysis?.success) {
      return NextResponse.json(
        { success: false, error: "Missing action generation payload." },
        { status: 400 }
      );
    }

    if (MODE === "DEV" || MODE === "HYBRID") {
      return NextResponse.json({
        success: true,
        kind,
        outputs: buildDeterministicOutputs(kind, analysis),
        fallback_used: false
      } satisfies GeneratedActionsResponse);
    }

    try {
      return NextResponse.json({
        success: true,
        kind,
        outputs: await runLiveGeneration(kind, analysis),
        fallback_used: false
      } satisfies GeneratedActionsResponse);
    } catch {
      return NextResponse.json({
        success: true,
        kind,
        outputs: buildDeterministicOutputs(kind, analysis),
        fallback_used: true
      } satisfies GeneratedActionsResponse);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: message
      } satisfies GeneratedActionsResponse,
      { status: 500 }
    );
  }
}
