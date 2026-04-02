import { NextRequest, NextResponse } from "next/server";
import { bootstrapAccountForUser, getAccountSummary, isPersistenceConfigured } from "@/lib/persistence";
import { getUserPlanUsage } from "@/lib/plan-capabilities";
import { getAuthenticatedRequestUser } from "@/lib/request-auth";
import { getErrorMessage } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedRequestUser(request);

    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const [summary, planUsage] = await Promise.all([
      getAccountSummary(auth.user.id, auth.accessToken),
      getUserPlanUsage(auth.user.id, auth.accessToken)
    ]);

    return NextResponse.json({
      success: true,
      persistenceConfigured: isPersistenceConfigured(),
      ...summary,
      subscription: planUsage.subscription ?? summary.subscription ?? null,
      usage: planUsage.usage
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
      firstName?: string;
      lastName?: string;
      email?: string;
      avatarUrl?: string | null;
      workspaceName?: string;
      useCase?: string;
      teamSize?: string;
      industry?: string;
      inviteEmails?: string[];
      inviteRole?: string;
    };

    const summary = await bootstrapAccountForUser({
      userId: auth.user.id,
      email: body.email?.trim() ?? auth.user.email,
      firstName: body.firstName?.trim() ?? auth.user.first_name,
      lastName: body.lastName?.trim() ?? auth.user.last_name,
      avatarUrl: body.avatarUrl ?? auth.user.avatar_url ?? null,
      workspaceName: body.workspaceName?.trim(),
      useCase: body.useCase?.trim(),
      teamSize: body.teamSize?.trim(),
      industry: body.industry?.trim(),
      inviteEmails: Array.isArray(body.inviteEmails)
        ? body.inviteEmails.map((email) => email.trim().toLowerCase()).filter(Boolean)
        : [],
      inviteRole: body.inviteRole?.trim() || "member",
      accessToken: auth.accessToken
    });
    const planUsage = await getUserPlanUsage(auth.user.id, auth.accessToken);

    return NextResponse.json({
      success: true,
      persistenceConfigured: isPersistenceConfigured(),
      ...summary,
      subscription: planUsage.subscription ?? summary.subscription ?? null,
      usage: planUsage.usage
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
