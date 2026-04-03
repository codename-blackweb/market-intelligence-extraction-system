"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { persistStoredPlan } from "@/lib/client-identity";
import type {
  AccountSummaryResponse,
  UserPlan
} from "@/types/market-analysis";
import styles from "./account-profile.module.css";

type AccountFormState = {
  firstName: string;
  lastName: string;
  workEmail: string;
  workspaceName: string;
  primaryUseCase: string;
  teamSize: string;
  industry: string;
};

const emptyForm: AccountFormState = {
  firstName: "",
  lastName: "",
  workEmail: "",
  workspaceName: "",
  primaryUseCase: "",
  teamSize: "",
  industry: ""
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getRoleLabel(role: string | undefined) {
  if (role === "admin") {
    return "Admin";
  }

  if (role === "strategist") {
    return "Strategist";
  }

  if (role === "member") {
    return "Member";
  }

  return "Owner";
}

function formatPlan(plan: UserPlan | undefined) {
  if (plan === "agency") {
    return "Agency";
  }

  if (plan === "pro") {
    return "Pro";
  }

  return "Free";
}

async function fetchAccountSummary(accessToken: string) {
  const response = await fetch("/api/account", {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  const json = (await response.json()) as AccountSummaryResponse;

  if (!response.ok || !json.success) {
    throw new Error(json.error || "Unable to load account.");
  }

  return json;
}

export default function LightswindAccountProfile() {
  const { isAuthenticated, isReady, plan, session, setPlan } = useAuth();
  const [summary, setSummary] = useState<AccountSummaryResponse | null>(null);
  const [form, setForm] = useState<AccountFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    let mounted = true;

    void (async () => {
      try {
        setLoading(true);
        setError("");
        const nextSummary = await fetchAccountSummary(session.access_token);

        if (!mounted) {
          return;
        }

        setSummary(nextSummary);

        const nextPlan =
          nextSummary.usage?.plan ??
          (nextSummary.subscription?.plan === "pro" || nextSummary.subscription?.plan === "agency"
            ? nextSummary.subscription.plan
            : "free");

        setPlan(nextPlan);
        persistStoredPlan(nextPlan);
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load account.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isReady, session?.access_token, setPlan]);

  useEffect(() => {
    setForm({
      firstName: summary?.profile?.first_name ?? session?.user.first_name ?? "",
      lastName: summary?.profile?.last_name ?? session?.user.last_name ?? "",
      workEmail: summary?.profile?.work_email ?? session?.user.email ?? "",
      workspaceName: summary?.workspace?.name ?? "",
      primaryUseCase: summary?.workspace?.primary_use_case ?? "",
      teamSize: summary?.workspace?.team_size ?? "",
      industry: summary?.workspace?.industry ?? ""
    });
  }, [
    session?.user.email,
    session?.user.first_name,
    session?.user.last_name,
    summary?.profile?.first_name,
    summary?.profile?.last_name,
    summary?.profile?.work_email,
    summary?.workspace?.industry,
    summary?.workspace?.name,
    summary?.workspace?.primary_use_case,
    summary?.workspace?.team_size
  ]);

  const currentPlan =
    summary?.usage?.plan ??
    (summary?.subscription?.plan === "pro" || summary?.subscription?.plan === "agency"
      ? summary.subscription.plan
      : plan);

  const displayName = useMemo(() => {
    const fromSummary = summary?.profile
      ? `${summary.profile.first_name} ${summary.profile.last_name}`.trim()
      : "";

    return fromSummary || session?.user.full_name || "Workspace Owner";
  }, [session?.user.full_name, summary?.profile]);

  const ownerRole = useMemo(() => {
    const currentUserId = summary?.profile?.id;
    const member = summary?.members?.find(
      (entry) => entry.user_id === currentUserId && entry.status === "active"
    );

    return getRoleLabel(member?.role);
  }, [summary?.members, summary?.profile?.id]);

  const handleChange = (field: keyof AccountFormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!session?.access_token) {
      return;
    }

    if (!form.workEmail.trim() || !form.workspaceName.trim()) {
      setMessage("Work email and workspace name are required.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.workEmail.trim(),
          workspaceName: form.workspaceName.trim(),
          useCase: form.primaryUseCase.trim(),
          teamSize: form.teamSize.trim(),
          industry: form.industry.trim()
        })
      });
      const json = (await response.json()) as AccountSummaryResponse;

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Unable to save account.");
      }

      setSummary(json);

      const nextPlan =
        json.usage?.plan ??
        (json.subscription?.plan === "pro" || json.subscription?.plan === "agency"
          ? json.subscription.plan
          : "free");

      setPlan(nextPlan);
      persistStoredPlan(nextPlan);
      setMessage("Profile changes saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save account.");
    } finally {
      setSaving(false);
    }
  };

  if (!isReady) {
    return null;
  }

  if (!isAuthenticated || !session) {
    return (
      <main className={styles.page}>
        <div className={styles.signinShell}>
          <section className={styles.signinCard}>
            <p className={styles.eyebrow}>Account Access</p>
            <h1 className={styles.signinTitle}>Sign in to manage your account.</h1>
            <p className={styles.signinCopy}>
              Account details and workspace settings are only available behind your current auth
              session.
            </p>
            <Link className={styles.signinLink} href="/auth">
              Continue to login
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.headerCard}>
          <div className={styles.headerRow}>
            <div className={styles.identityGroup}>
              <div className={styles.avatar}>{getInitials(displayName)}</div>

              <div className={styles.headerMeta}>
                <p className={styles.eyebrow}>Account</p>
                <h1 className={styles.pageTitle}>{displayName}</h1>
                <div className={styles.roleRow}>
                  <span className={styles.rolePill}>{ownerRole}</span>
                  <span className={styles.planPill}>{formatPlan(currentPlan)}</span>
                </div>
                <p className={styles.headerSubcopy}>
                  Structured profile settings for your owner identity and workspace context.
                </p>
              </div>
            </div>

            <Link className={styles.workspaceLink} href="/workspace">
              View Workspace
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </section>

        {message ? <div className={styles.messageCard}>{message}</div> : null}
        {error ? <div className={`${styles.messageCard} ${styles.messageError}`}>{error}</div> : null}

        {loading ? (
          <section className={styles.stateCard}>
            <p className={styles.eyebrow}>Loading</p>
            <p className={styles.stateCopy}>Loading account details...</p>
          </section>
        ) : null}

        {!loading ? (
          <>
            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Personal Information</h2>
                <p className={styles.sectionDescription}>
                  Keep your owner profile aligned across the authenticated workspace.
                </p>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="account-first-name">
                    First Name
                  </label>
                  <input
                    className={styles.input}
                    id="account-first-name"
                    onChange={(event) => handleChange("firstName", event.target.value)}
                    type="text"
                    value={form.firstName}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="account-last-name">
                    Last Name
                  </label>
                  <input
                    className={styles.input}
                    id="account-last-name"
                    onChange={(event) => handleChange("lastName", event.target.value)}
                    type="text"
                    value={form.lastName}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="account-email">
                    Work Email
                  </label>
                  <input
                    className={styles.input}
                    id="account-email"
                    onChange={(event) => handleChange("workEmail", event.target.value)}
                    type="email"
                    value={form.workEmail}
                  />
                </div>

                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Role</span>
                  <div className={styles.fieldReadonly}>{ownerRole}</div>
                </div>
              </div>
            </section>

            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Workspace Details</h2>
                <p className={styles.sectionDescription}>
                  These fields shape the workspace-facing context without altering any backend
                  behavior.
                </p>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="account-workspace-name">
                    Workspace Name
                  </label>
                  <input
                    className={styles.input}
                    id="account-workspace-name"
                    onChange={(event) => handleChange("workspaceName", event.target.value)}
                    type="text"
                    value={form.workspaceName}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="account-team-size">
                    Team Size
                  </label>
                  <input
                    className={styles.input}
                    id="account-team-size"
                    onChange={(event) => handleChange("teamSize", event.target.value)}
                    type="text"
                    value={form.teamSize}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="account-industry">
                    Industry
                  </label>
                  <input
                    className={styles.input}
                    id="account-industry"
                    onChange={(event) => handleChange("industry", event.target.value)}
                    type="text"
                    value={form.industry}
                  />
                </div>

                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.fieldLabel} htmlFor="account-use-case">
                    Workspace Description
                  </label>
                  <textarea
                    className={styles.textarea}
                    id="account-use-case"
                    onChange={(event) => handleChange("primaryUseCase", event.target.value)}
                    rows={4}
                    value={form.primaryUseCase}
                  />
                </div>
              </div>

              <div className={styles.saveRow}>
                <button
                  className={styles.saveButton}
                  disabled={saving}
                  onClick={() => void handleSave()}
                  type="button"
                >
                  {saving ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
