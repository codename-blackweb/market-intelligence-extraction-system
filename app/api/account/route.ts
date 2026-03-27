import { NextRequest, NextResponse } from "next/server";
import {
  createWorkspace,
  createWorkspaceInvites,
  getPersistedProfile,
  isPersistenceConfigured,
  listPersistedAnalyses,
  listWorkspaceInvites,
  listWorkspacesByOwner,
  upsertPersistedProfile
} from "@/lib/persistence";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")?.trim();

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 });
    }

    const [profile, analyses, workspaces] = await Promise.all([
      getPersistedProfile(userId),
      listPersistedAnalyses(userId),
      listWorkspacesByOwner(userId)
    ]);

    const workspace =
      workspaces.find((item) => item.id === profile?.default_workspace_id) ?? workspaces[0] ?? null;
    const invites = workspace ? await listWorkspaceInvites(workspace.id) : [];

    return NextResponse.json({
      success: true,
      persistenceConfigured: isPersistenceConfigured(),
      profile,
      workspace,
      workspaces,
      invites,
      analyses,
      sharedReportsCount: analyses.filter((analysis) => analysis.is_public).length,
      savedAnalysesCount: analyses.length
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
      email?: string;
      firstName?: string;
      lastName?: string;
      workspaceName?: string;
      useCase?: string;
      teamSize?: string;
      industry?: string;
      inviteEmails?: string[];
    };

    if (
      !body.userId ||
      !body.email ||
      !body.workspaceName ||
      !body.useCase ||
      !body.teamSize ||
      !body.industry
    ) {
      return NextResponse.json(
        { success: false, error: "Missing onboarding payload" },
        { status: 400 }
      );
    }

    const workspace = await createWorkspace({
      ownerId: body.userId,
      name: body.workspaceName.trim(),
      useCase: body.useCase.trim(),
      teamSize: body.teamSize.trim(),
      industry: body.industry.trim()
    });

    const profile = await upsertPersistedProfile({
      userId: body.userId,
      plan: "free",
      email: body.email.trim().toLowerCase(),
      firstName: body.firstName?.trim() ?? "",
      lastName: body.lastName?.trim() ?? "",
      defaultWorkspaceId: workspace?.id ?? null
    });

    const invites = workspace
      ? await createWorkspaceInvites({
          workspaceId: workspace.id,
          emails: Array.isArray(body.inviteEmails)
            ? body.inviteEmails
                .map((email) => email.trim().toLowerCase())
                .filter(Boolean)
            : []
        })
      : [];

    return NextResponse.json({
      success: true,
      persistenceConfigured: isPersistenceConfigured(),
      profile,
      workspace,
      invites
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
