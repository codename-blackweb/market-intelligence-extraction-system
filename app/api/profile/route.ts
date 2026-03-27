import { NextRequest, NextResponse } from "next/server";
import {
  getPersistedProfile,
  isPersistenceConfigured,
  upsertPersistedProfile
} from "@/lib/persistence";
import type { UserPlan } from "@/types/market-analysis";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")?.trim();

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 });
    }

    const profile = await getPersistedProfile(userId);

    return NextResponse.json({
      success: true,
      persistenceConfigured: isPersistenceConfigured(),
      profile
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
      plan?: UserPlan;
    };

    if (!body.userId || (body.plan !== "free" && body.plan !== "pro" && body.plan !== "agency")) {
      return NextResponse.json(
        { success: false, error: "Missing profile payload" },
        { status: 400 }
      );
    }

    const profile = await upsertPersistedProfile(body.userId, body.plan);

    return NextResponse.json({
      success: true,
      persistenceConfigured: isPersistenceConfigured(),
      profile
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
