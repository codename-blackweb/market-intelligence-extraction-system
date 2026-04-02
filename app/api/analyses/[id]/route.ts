import { NextRequest, NextResponse } from "next/server";
import {
  getPersistedAnalysisById,
  isPersistenceConfigured,
  setPersistedAnalysisVisibility
} from "@/lib/persistence";
import { getAuthenticatedRequestUser } from "@/lib/request-auth";
import { getErrorMessage } from "@/lib/utils";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params;
    const publicOnly = request.nextUrl.searchParams.get("public") === "1";

    let userId: string | undefined;
    let accessToken: string | undefined;

    if (!publicOnly) {
      const auth = await getAuthenticatedRequestUser(request);

      if (!auth) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }

      userId = auth.user.id;
      accessToken = auth.accessToken;
    }

    const analysis = await getPersistedAnalysisById(id, userId, publicOnly, accessToken);

    if (!analysis) {
      return NextResponse.json({ success: false, error: "Analysis not found" }, { status: 404 });
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

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params;
    const auth = await getAuthenticatedRequestUser(request);

    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      isPublic?: boolean;
    };

    if (typeof body.isPublic !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Missing visibility payload" },
        { status: 400 }
      );
    }

    const analysis = await setPersistedAnalysisVisibility({
      id,
      userId: auth.user.id,
      isPublic: body.isPublic,
      accessToken: auth.accessToken
    });

    if (!analysis) {
      return NextResponse.json({ success: false, error: "Analysis not found" }, { status: 404 });
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
