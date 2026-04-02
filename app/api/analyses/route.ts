import { NextRequest, NextResponse } from "next/server";
import {
  createPersistedAnalysis,
  isPersistenceConfigured,
  listPersistedAnalyses
} from "@/lib/persistence";
import { getAuthenticatedRequestUser } from "@/lib/request-auth";
import type { MarketAnalysisSuccessResponse } from "@/types/market-analysis";
import { getErrorMessage } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedRequestUser(request);

    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const analyses = await listPersistedAnalyses(auth.user.id, auth.accessToken);

    return NextResponse.json({
      success: true,
      persistenceConfigured: isPersistenceConfigured(),
      analyses
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedRequestUser(request);

    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      query?: string;
      marketType?: string;
      depth?: string;
      result?: MarketAnalysisSuccessResponse;
      workspaceId?: string | null;
    };

    if (!body.query || !body.result) {
      return NextResponse.json(
        { success: false, error: "Missing analysis persistence payload" },
        { status: 400 }
      );
    }

    const analysis = await createPersistedAnalysis({
      user_id: auth.user.id,
      workspace_id: body.workspaceId ?? null,
      query: body.query,
      market_type: body.marketType ?? "",
      depth: body.depth ?? "standard",
      result_json: body.result,
      accessToken: auth.accessToken
    });

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "Analysis persistence is not configured." },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      persistenceConfigured: isPersistenceConfigured(),
      analysis
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
