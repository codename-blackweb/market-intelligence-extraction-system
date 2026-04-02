import type {
  AccountSummaryResponse,
  PersistedAnalysisRecord,
  SharedReportRecord,
  SubscriptionRecord,
  UserPlan,
  UserProfileRecord,
  WorkspaceInviteRecord,
  WorkspaceMemberRecord,
  WorkspaceRecord
} from "@/types/market-analysis";
import {
  createSupabaseAdminClient,
  createSupabaseUserClient,
  isSupabaseConfigured,
  isSupabaseServiceConfigured
} from "@/lib/supabase-core";

function getPersistenceClient(accessToken?: string) {
  if (accessToken) {
    return createSupabaseUserClient(accessToken);
  }

  return createSupabaseAdminClient();
}

export function isPersistenceConfigured() {
  return isSupabaseServiceConfigured() || isSupabaseConfigured();
}

function mapProfile(row: Record<string, unknown>): UserProfileRecord {
  return {
    id: String(row.id),
    first_name: String(row.first_name ?? ""),
    last_name: String(row.last_name ?? ""),
    work_email: String(row.work_email ?? ""),
    avatar_url:
      typeof row.avatar_url === "string" && row.avatar_url.length ? row.avatar_url : null,
    created_at: String(row.created_at ?? new Date().toISOString())
  };
}

function mapWorkspace(row: Record<string, unknown>): WorkspaceRecord {
  return {
    id: String(row.id),
    owner_id: String(row.owner_id),
    name: String(row.name ?? ""),
    primary_use_case: String(row.primary_use_case ?? ""),
    team_size: String(row.team_size ?? ""),
    industry: String(row.industry ?? ""),
    created_at: String(row.created_at ?? new Date().toISOString())
  };
}

function mapWorkspaceMember(row: Record<string, unknown>): WorkspaceMemberRecord {
  return {
    id: String(row.id),
    workspace_id: String(row.workspace_id),
    user_id: typeof row.user_id === "string" && row.user_id.length ? row.user_id : null,
    role: String(row.role ?? "member"),
    invited_email:
      typeof row.invited_email === "string" && row.invited_email.length ? row.invited_email : null,
    status: String(row.status ?? "pending"),
    created_at: String(row.created_at ?? new Date().toISOString())
  };
}

function mapSubscription(row: Record<string, unknown>): SubscriptionRecord {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    plan: (row.plan === "pro" || row.plan === "agency" ? row.plan : "free") satisfies UserPlan,
    status: String(row.status ?? "active"),
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString())
  };
}

function mapSharedReport(row: Record<string, unknown>): SharedReportRecord {
  return {
    id: String(row.id),
    analysis_id: String(row.analysis_id),
    user_id: String(row.user_id),
    public_token: String(row.public_token ?? ""),
    is_public: Boolean(row.is_public),
    created_at: String(row.created_at ?? new Date().toISOString())
  };
}

function mapAnalysis(row: Record<string, unknown>): PersistedAnalysisRecord {
  const sharedReports = Array.isArray(row.shared_reports)
    ? (row.shared_reports as Record<string, unknown>[]).map(mapSharedReport)
    : [];
  const sharedReport = sharedReports[0] ?? null;

  return {
    id: String(row.id),
    user_id: String(row.user_id),
    workspace_id:
      typeof row.workspace_id === "string" && row.workspace_id.length ? row.workspace_id : null,
    query: String(row.query ?? ""),
    market_type: String(row.market_type ?? ""),
    depth: String(row.depth ?? "standard"),
    result_json: row.result_json as PersistedAnalysisRecord["result_json"],
    created_at: String(row.created_at ?? new Date().toISOString()),
    shared_report: sharedReport,
    is_public: Boolean(sharedReport?.is_public)
  };
}

async function getSingleRow<T extends Record<string, unknown>>(
  promiseLike: PromiseLike<{ data: T | null; error: Error | null }>
) {
  const { data, error } = await promiseLike;

  if (error) {
    throw error;
  }

  return data;
}

export async function getPersistedProfile(userId: string, accessToken?: string) {
  const client = getPersistenceClient(accessToken);

  if (!client) {
    return null;
  }

  const row = await getSingleRow(
    client
      .from("profiles")
      .select("id,first_name,last_name,work_email,avatar_url,created_at")
      .eq("id", userId)
      .maybeSingle()
  );

  return row ? mapProfile(row) : null;
}

export async function getPersistedSubscription(userId: string, accessToken?: string) {
  const client = getPersistenceClient(accessToken);

  if (!client) {
    return null;
  }

  const row = await getSingleRow(
    client
      .from("subscriptions")
      .select("id,user_id,plan,status,created_at,updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  );

  return row ? mapSubscription(row) : null;
}

export async function upsertPersistedProfile(input: {
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  accessToken?: string;
}) {
  const client = getPersistenceClient(input.accessToken);

  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from("profiles")
    .upsert(
      {
        id: input.userId,
        first_name: input.firstName ?? "",
        last_name: input.lastName ?? "",
        work_email: input.email ?? "",
        avatar_url: input.avatarUrl ?? null
      },
      {
        onConflict: "id"
      }
    )
    .select("id,first_name,last_name,work_email,avatar_url,created_at")
    .single();

  if (error) {
    throw error;
  }

  return mapProfile(data);
}

export async function upsertPersistedSubscription(input: {
  userId: string;
  plan: UserPlan;
  status?: string;
  accessToken?: string;
}) {
  const client = getPersistenceClient(input.accessToken);

  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from("subscriptions")
    .upsert(
      {
        user_id: input.userId,
        plan: input.plan,
        status: input.status ?? "active"
      },
      {
        onConflict: "user_id"
      }
    )
    .select("id,user_id,plan,status,created_at,updated_at")
    .single();

  if (error) {
    throw error;
  }

  return mapSubscription(data);
}

export async function createWorkspace(input: {
  ownerId: string;
  name: string;
  useCase: string;
  teamSize: string;
  industry: string;
  accessToken?: string;
}) {
  const client = getPersistenceClient(input.accessToken);

  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from("workspaces")
    .insert({
      owner_id: input.ownerId,
      name: input.name,
      primary_use_case: input.useCase,
      team_size: input.teamSize,
      industry: input.industry
    })
    .select("id,owner_id,name,primary_use_case,team_size,industry,created_at")
    .single();

  if (error) {
    throw error;
  }

  return mapWorkspace(data);
}

export async function listWorkspacesByOwner(userId: string, accessToken?: string) {
  const client = getPersistenceClient(accessToken);

  if (!client) {
    return [] as WorkspaceRecord[];
  }

  const { data, error } = await client
    .from("workspaces")
    .select("id,owner_id,name,primary_use_case,team_size,industry,created_at")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data.map(mapWorkspace) : [];
}

export async function ensureWorkspaceOwnerMember(input: {
  workspaceId: string;
  userId: string;
  accessToken?: string;
}) {
  const client = getPersistenceClient(input.accessToken);

  if (!client) {
    return null;
  }

  const { data: existing, error: existingError } = await client
    .from("workspace_members")
    .select("id,workspace_id,user_id,role,invited_email,status,created_at")
    .eq("workspace_id", input.workspaceId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    if (existing.role === "owner" && existing.status === "active") {
      return mapWorkspaceMember(existing);
    }

    const { data, error } = await client
      .from("workspace_members")
      .update({
        role: "owner",
        status: "active"
      })
      .eq("id", existing.id)
      .select("id,workspace_id,user_id,role,invited_email,status,created_at")
      .single();

    if (error) {
      throw error;
    }

    return mapWorkspaceMember(data);
  }

  const { data, error } = await client
    .from("workspace_members")
    .insert({
      workspace_id: input.workspaceId,
      user_id: input.userId,
      role: "owner",
      status: "active"
    })
    .select("id,workspace_id,user_id,role,invited_email,status,created_at")
    .single();

  if (error) {
    throw error;
  }

  return mapWorkspaceMember(data);
}

export async function createWorkspaceInvites(input: {
  workspaceId: string;
  emails: string[];
  role?: string;
  accessToken?: string;
}) {
  const client = getPersistenceClient(input.accessToken);

  if (!client || input.emails.length === 0) {
    return [] as WorkspaceInviteRecord[];
  }

  const normalizedEmails = input.emails.map((email) => email.trim().toLowerCase()).filter(Boolean);

  if (normalizedEmails.length === 0) {
    return [] as WorkspaceInviteRecord[];
  }

  const { data: existingRows, error: existingError } = await client
    .from("workspace_members")
    .select("id,workspace_id,user_id,role,invited_email,status,created_at")
    .eq("workspace_id", input.workspaceId)
    .in("invited_email", normalizedEmails);

  if (existingError) {
    throw existingError;
  }

  const existingByEmail = new Map(
    (Array.isArray(existingRows) ? existingRows : [])
      .filter((row) => typeof row.invited_email === "string" && row.invited_email.length > 0)
      .map((row) => [String(row.invited_email).toLowerCase(), row])
  );

  const inserts = normalizedEmails.filter((email) => !existingByEmail.has(email));
  const updates = normalizedEmails.filter((email) => existingByEmail.has(email));

  const records: WorkspaceInviteRecord[] = [];

  if (updates.length > 0) {
    for (const email of updates) {
      const existing = existingByEmail.get(email);

      if (!existing) {
        continue;
      }

      if (existing.role === (input.role ?? "member") && existing.status === "invited") {
        records.push(mapWorkspaceMember(existing));
        continue;
      }

      const { data, error } = await client
        .from("workspace_members")
        .update({
          role: input.role ?? "member",
          status: "invited"
        })
        .eq("id", existing.id)
        .select("id,workspace_id,user_id,role,invited_email,status,created_at")
        .single();

      if (error) {
        throw error;
      }

      records.push(mapWorkspaceMember(data));
    }
  }

  if (inserts.length === 0) {
    return records;
  }

  const { data, error } = await client
    .from("workspace_members")
    .insert(
      inserts.map((email) => ({
        workspace_id: input.workspaceId,
        invited_email: email,
        role: input.role ?? "member",
        status: "invited"
      }))
    )
    .select("id,workspace_id,user_id,role,invited_email,status,created_at");

  if (error) {
    throw error;
  }

  return records.concat(Array.isArray(data) ? data.map(mapWorkspaceMember) : []);
}

export async function listWorkspaceMembers(workspaceId: string, accessToken?: string) {
  const client = getPersistenceClient(accessToken);

  if (!client) {
    return [] as WorkspaceMemberRecord[];
  }

  const { data, error } = await client
    .from("workspace_members")
    .select("id,workspace_id,user_id,role,invited_email,status,created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data.map(mapWorkspaceMember) : [];
}

export async function listWorkspaceInvites(workspaceId: string) {
  const members = await listWorkspaceMembers(workspaceId);
  return members.filter((member) => member.invited_email);
}

export async function listPersistedAnalyses(userId: string, accessToken?: string) {
  const client = getPersistenceClient(accessToken);

  if (!client) {
    return [] as PersistedAnalysisRecord[];
  }

  const { data, error } = await client
    .from("analyses")
    .select(
      "id,user_id,workspace_id,query,market_type,depth,result_json,created_at,shared_reports(id,analysis_id,user_id,public_token,is_public,created_at)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data.map((row) => mapAnalysis(row as Record<string, unknown>)) : [];
}

export async function createPersistedAnalysis(input: {
  user_id: string;
  workspace_id?: string | null;
  query: string;
  market_type: string;
  depth: string;
  result_json: PersistedAnalysisRecord["result_json"];
  accessToken?: string;
}) {
  const client = getPersistenceClient(input.accessToken);

  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from("analyses")
    .insert({
      user_id: input.user_id,
      workspace_id: input.workspace_id ?? null,
      query: input.query,
      market_type: input.market_type,
      depth: input.depth,
      result_json: input.result_json
    })
    .select("id,user_id,workspace_id,query,market_type,depth,result_json,created_at")
    .single();

  if (error) {
    throw error;
  }

  return mapAnalysis({
    ...data,
    shared_reports: []
  });
}

export async function getPersistedAnalysisById(
  id: string,
  userId?: string,
  requirePublic = false,
  accessToken?: string
) {
  const client = getPersistenceClient(accessToken);

  if (!client) {
    return null;
  }

  let query = client
    .from("analyses")
    .select(
      "id,user_id,workspace_id,query,market_type,depth,result_json,created_at,shared_reports(id,analysis_id,user_id,public_token,is_public,created_at)"
    )
    .eq("id", id)
    .limit(1);

  if (!requirePublic && userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const analysis = mapAnalysis(data as Record<string, unknown>);

  if (requirePublic && !analysis.is_public) {
    return null;
  }

  return analysis;
}

export async function listSharedReportsByUser(userId: string, accessToken?: string) {
  const client = getPersistenceClient(accessToken);

  if (!client) {
    return [] as SharedReportRecord[];
  }

  const { data, error } = await client
    .from("shared_reports")
    .select("id,analysis_id,user_id,public_token,is_public,created_at")
    .eq("user_id", userId)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data.map(mapSharedReport) : [];
}

export async function setPersistedAnalysisVisibility(input: {
  id: string;
  userId: string;
  isPublic: boolean;
  accessToken?: string;
}) {
  const client = getPersistenceClient(input.accessToken);

  if (!client) {
    return null;
  }

  const analysis = await getPersistedAnalysisById(
    input.id,
    input.userId,
    false,
    input.accessToken
  );

  if (!analysis) {
    return null;
  }

  const { data, error } = await client
    .from("shared_reports")
    .upsert(
      {
        analysis_id: input.id,
        user_id: input.userId,
        public_token: crypto.randomUUID(),
        is_public: input.isPublic
      },
      {
        onConflict: "analysis_id"
      }
    )
    .select("id,analysis_id,user_id,public_token,is_public,created_at")
    .single();

  if (error) {
    throw error;
  }

  return {
    ...analysis,
    shared_report: mapSharedReport(data),
    is_public: Boolean(data.is_public)
  } satisfies PersistedAnalysisRecord;
}

function getDefaultWorkspaceName(input: {
  firstName?: string;
  lastName?: string;
  email?: string;
}) {
  const name = `${input.firstName ?? ""} ${input.lastName ?? ""}`.trim();

  if (name) {
    return `${name}'s Workspace`;
  }

  const emailPrefix = input.email?.split("@")[0]?.trim();
  return emailPrefix ? `${emailPrefix}'s Workspace` : "Personal Workspace";
}

export async function bootstrapAccountForUser(input: {
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  workspaceName?: string;
  useCase?: string;
  teamSize?: string;
  industry?: string;
  inviteEmails?: string[];
  inviteRole?: string;
  accessToken?: string;
}) {
  const existingWorkspaces = await listWorkspacesByOwner(input.userId, input.accessToken);
  const profile = await upsertPersistedProfile({
    userId: input.userId,
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    avatarUrl: input.avatarUrl ?? null,
    accessToken: input.accessToken
  });
  const subscription =
    (await getPersistedSubscription(input.userId, input.accessToken)) ??
    (await upsertPersistedSubscription({
      userId: input.userId,
      plan: "free",
      status: "active",
      accessToken: input.accessToken
    }));

  let workspace: WorkspaceRecord | null = existingWorkspaces[0] ?? null;

  if (!workspace) {
    workspace = await createWorkspace({
      ownerId: input.userId,
      name: input.workspaceName?.trim() || getDefaultWorkspaceName(input),
      useCase: input.useCase?.trim() || "Founder / Product Validation",
      teamSize: input.teamSize?.trim() || "Just me",
      industry: input.industry?.trim() || "General",
      accessToken: input.accessToken
    });
  }

  if (workspace) {
    await ensureWorkspaceOwnerMember({
      workspaceId: workspace.id,
      userId: input.userId,
      accessToken: input.accessToken
    });

    if (input.inviteEmails?.length) {
      await createWorkspaceInvites({
        workspaceId: workspace.id,
        emails: input.inviteEmails.map((email) => email.trim().toLowerCase()).filter(Boolean),
        role: input.inviteRole ?? "member",
        accessToken: input.accessToken
      });
    }
  }

  const [workspaces, members, analyses, sharedReports] = await Promise.all([
    listWorkspacesByOwner(input.userId, input.accessToken),
    workspace
      ? listWorkspaceMembers(workspace.id, input.accessToken)
      : Promise.resolve([] as WorkspaceMemberRecord[]),
    listPersistedAnalyses(input.userId, input.accessToken),
    listSharedReportsByUser(input.userId, input.accessToken)
  ]);

  return {
    profile,
    subscription,
    workspace: workspace ?? workspaces[0] ?? null,
    workspaces,
    members,
    invites: members.filter((member) => member.invited_email) as WorkspaceInviteRecord[],
    analyses,
    sharedReports,
    sharedReportsCount: sharedReports.length,
    savedAnalysesCount: analyses.length
  } satisfies Omit<AccountSummaryResponse, "success" | "persistenceConfigured" | "error">;
}

export async function getAccountSummary(userId: string, accessToken?: string) {
  const [profile, subscription, workspaces, analyses, sharedReports] = await Promise.all([
    getPersistedProfile(userId, accessToken),
    getPersistedSubscription(userId, accessToken),
    listWorkspacesByOwner(userId, accessToken),
    listPersistedAnalyses(userId, accessToken),
    listSharedReportsByUser(userId, accessToken)
  ]);

  const workspace = workspaces[0] ?? null;
  const members = workspace ? await listWorkspaceMembers(workspace.id, accessToken) : [];

  return {
    profile,
    subscription,
    workspace,
    workspaces,
    members,
    invites: members.filter((member) => member.invited_email) as WorkspaceInviteRecord[],
    analyses,
    sharedReports,
    sharedReportsCount: sharedReports.length,
    savedAnalysesCount: analyses.length
  } satisfies Omit<AccountSummaryResponse, "success" | "persistenceConfigured" | "error">;
}
