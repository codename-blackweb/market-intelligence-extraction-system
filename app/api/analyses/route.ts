import { NextRequest, NextResponse } from "next/server";
import {
  createPersistedAnalysis,
  isPersistenceConfigured,
  listPersistedAnalyses
} from "@/lib/persistence";
import type { MarketAnalysisSuccessResponse } from "@/types/market-analysis";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")?.trim();

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 });
    }

    const analyses = await listPersistedAnalyses(userId);

    return NextResponse.json({
      success: true,
      persistenceConfigured: isPersistenceConfigured(),
      analyses
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      query?: string;
      marketType?: string;
      depth?: string;
      result?: MarketAnalysisSuccessResponse;
      isPublic?: boolean;
    };

    if (!body.userId || !body.query || !body.result) {
      return NextResponse.json(
        { success: false, error: "Missing analysis persistence payload" },
        { status: 400 }
      );
    }

    const analysis = await createPersistedAnalysis({
      user_id: body.userId,
      query: body.query,
      market_type: body.marketType ?? "",
      depth: body.depth ?? "standard",
      result_json: body.result,
      is_public: body.isPublic ?? false
    });

    return NextResponse.json({
      success: true,
      persistenceConfigured: isPersistenceConfigured(),
      analysis
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
