import { NextRequest, NextResponse } from "next/server";
import {
  getPersistedAnalysisById,
  isPersistenceConfigured,
  setPersistedAnalysisVisibility
} from "@/lib/persistence";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params;
    const userId = request.nextUrl.searchParams.get("userId")?.trim();
    const publicOnly = request.nextUrl.searchParams.get("public") === "1";
    const analysis = await getPersistedAnalysisById(id, userId, publicOnly);

    if (!analysis) {
      return NextResponse.json({ success: false, error: "Analysis not found" }, { status: 404 });
    }

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

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      userId?: string;
      isPublic?: boolean;
    };

    if (!body.userId || typeof body.isPublic !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Missing visibility payload" },
        { status: 400 }
      );
    }

    const analysis = await setPersistedAnalysisVisibility({
      id,
      userId: body.userId,
      isPublic: body.isPublic
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
