import type {
  PersistedAnalysisRecord,
  UserPlan,
  UserProfileRecord,
  WorkspaceInviteRecord,
  WorkspaceRecord
} from "@/types/market-analysis";

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return {
    url,
    serviceRoleKey
  };
}

async function supabaseRequest(path: string, init?: RequestInit) {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Persistence request failed: ${response.status} ${await response.text()}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function escapeValue(value: string) {
  return encodeURIComponent(value);
}

export function isPersistenceConfigured() {
  return Boolean(getSupabaseConfig());
}

export async function listPersistedAnalyses(userId: string) {
  if (!isPersistenceConfigured()) {
    return [] as PersistedAnalysisRecord[];
  }

  const payload = await supabaseRequest(
    `analyses?select=id,user_id,query,market_type,depth,result_json,is_public,created_at&user_id=eq.${escapeValue(
      userId
    )}&order=created_at.desc&limit=20`
  );

  return Array.isArray(payload) ? (payload as PersistedAnalysisRecord[]) : [];
}

export async function createPersistedAnalysis(input: {
  user_id: string;
  query: string;
  market_type: string;
  depth: string;
  result_json: PersistedAnalysisRecord["result_json"];
  is_public?: boolean;
}) {
  if (!isPersistenceConfigured()) {
    return null;
  }

  const payload = await supabaseRequest("analyses", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      is_public: input.is_public ?? false
    })
  });

  return Array.isArray(payload) ? ((payload[0] as PersistedAnalysisRecord) ?? null) : null;
}

export async function getPersistedAnalysisById(id: string, userId?: string, requirePublic = false) {
  if (!isPersistenceConfigured()) {
    return null;
  }

  const conditions = [`id=eq.${escapeValue(id)}`];

  if (requirePublic) {
    conditions.push("is_public=eq.true");
  } else if (userId) {
    conditions.push(`user_id=eq.${escapeValue(userId)}`);
  }

  const payload = await supabaseRequest(
    `analyses?select=id,user_id,query,market_type,depth,result_json,is_public,created_at&${conditions.join(
      "&"
    )}&limit=1`
  );

  return Array.isArray(payload) ? ((payload[0] as PersistedAnalysisRecord) ?? null) : null;
}

export async function setPersistedAnalysisVisibility(input: {
  id: string;
  userId: string;
  isPublic: boolean;
}) {
  if (!isPersistenceConfigured()) {
    return null;
  }

  const payload = await supabaseRequest(
    `analyses?id=eq.${escapeValue(input.id)}&user_id=eq.${escapeValue(input.userId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        is_public: input.isPublic
      })
    }
  );

  return Array.isArray(payload) ? ((payload[0] as PersistedAnalysisRecord) ?? null) : null;
}

export async function getPersistedProfile(userId: string) {
  if (!isPersistenceConfigured()) {
    return null;
  }

  const payload = await supabaseRequest(
    `user_profiles?select=user_id,plan,email,first_name,last_name,default_workspace_id,created_at,updated_at&user_id=eq.${escapeValue(
      userId
    )}&limit=1`
  );

  return Array.isArray(payload) ? ((payload[0] as UserProfileRecord) ?? null) : null;
}

export async function upsertPersistedProfile(input: {
  userId: string;
  plan: UserPlan;
  email?: string;
  firstName?: string;
  lastName?: string;
  defaultWorkspaceId?: string | null;
}) {
  if (!isPersistenceConfigured()) {
    return null;
  }

  const payload = await supabaseRequest("user_profiles?on_conflict=user_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify({
      user_id: input.userId,
      plan: input.plan,
      email: input.email ?? "",
      first_name: input.firstName ?? "",
      last_name: input.lastName ?? "",
      default_workspace_id: input.defaultWorkspaceId ?? null
    })
  });

  return Array.isArray(payload) ? ((payload[0] as UserProfileRecord) ?? null) : null;
}

export async function createWorkspace(input: {
  ownerId: string;
  name: string;
  useCase: string;
  teamSize: string;
  industry: string;
}) {
  if (!isPersistenceConfigured()) {
    return null;
  }

  const payload = await supabaseRequest("workspaces", {
    method: "POST",
    body: JSON.stringify({
      owner_id: input.ownerId,
      name: input.name,
      use_case: input.useCase,
      team_size: input.teamSize,
      industry: input.industry
    })
  });

  return Array.isArray(payload) ? ((payload[0] as WorkspaceRecord) ?? null) : null;
}

export async function listWorkspacesByOwner(userId: string) {
  if (!isPersistenceConfigured()) {
    return [] as WorkspaceRecord[];
  }

  const payload = await supabaseRequest(
    `workspaces?select=id,owner_id,name,use_case,team_size,industry,created_at&owner_id=eq.${escapeValue(
      userId
    )}&order=created_at.asc`
  );

  return Array.isArray(payload) ? (payload as WorkspaceRecord[]) : [];
}

export async function createWorkspaceInvites(input: {
  workspaceId: string;
  emails: string[];
  role?: string;
}) {
  if (!isPersistenceConfigured() || input.emails.length === 0) {
    return [] as WorkspaceInviteRecord[];
  }

  const payload = await supabaseRequest("workspace_invites", {
    method: "POST",
    body: JSON.stringify(
      input.emails.map((email) => ({
        workspace_id: input.workspaceId,
        email,
        role: input.role ?? "member"
      }))
    )
  });

  return Array.isArray(payload) ? (payload as WorkspaceInviteRecord[]) : [];
}

export async function listWorkspaceInvites(workspaceId: string) {
  if (!isPersistenceConfigured()) {
    return [] as WorkspaceInviteRecord[];
  }

  const payload = await supabaseRequest(
    `workspace_invites?select=id,workspace_id,email,role,status,created_at&workspace_id=eq.${escapeValue(
      workspaceId
    )}&order=created_at.asc`
  );

  return Array.isArray(payload) ? (payload as WorkspaceInviteRecord[]) : [];
}
