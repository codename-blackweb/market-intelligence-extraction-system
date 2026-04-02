import { NextRequest, NextResponse } from "next/server";
import {
  getPersistedProfile,
  getPersistedSubscription,
  isPersistenceConfigured,
  upsertPersistedSubscription
} from "@/lib/persistence";
import { getAuthenticatedRequestUser } from "@/lib/request-auth";
import type { UserPlan } from "@/types/market-analysis";
import { getErrorMessage } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedRequestUser(request);

    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const [profile, subscription] = await Promise.all([
      getPersistedProfile(auth.user.id, auth.accessToken),
      getPersistedSubscription(auth.user.id, auth.accessToken)
    ]);

    return NextResponse.json({
      success: true,
      persistenceConfigured: isPersistenceConfigured(),
      profile,
      subscription
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
      plan?: UserPlan;
      status?: string;
    };

    if (body.plan !== "free" && body.plan !== "pro" && body.plan !== "agency") {
      return NextResponse.json(
        { success: false, error: "Missing profile payload" },
        { status: 400 }
      );
    }

    const subscription = await upsertPersistedSubscription({
      userId: auth.user.id,
      plan: body.plan,
      status: body.status?.trim() || "active",
      accessToken: auth.accessToken
    });

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: "Subscription persistence is not configured." },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      persistenceConfigured: isPersistenceConfigured(),
      subscription
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
