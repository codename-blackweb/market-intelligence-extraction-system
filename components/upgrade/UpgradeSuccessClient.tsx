"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { clearPendingPlan, loadPendingPlan, persistStoredPlan } from "@/lib/client-identity";
import type { AccountSummaryResponse } from "@/types/market-analysis";

export default function UpgradeSuccessClient() {
  const { isReady, session, setPlan } = useAuth();
  const [isComplete, setIsComplete] = useState(false);
  const [planLabel, setPlanLabel] = useState("Pro");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isReady) {
      return;
    }

    let isMounted = true;

    async function completeUpgrade() {
      const plan = loadPendingPlan();
      const expectedPlan = plan === "agency" ? "Agency" : "Pro";
      setPlanLabel(expectedPlan);

      if (!plan) {
        setError("There is no pending upgrade attached to this session.");
        setIsComplete(true);
        return;
      }

      if (!session?.access_token) {
        setError("Sign in again to finish applying your plan.");
        setIsComplete(true);
        return;
      }

      try {
        const response = await fetch("/api/account", {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        const json = (await response.json()) as AccountSummaryResponse;

        if (!response.ok || !json.success) {
          throw new Error(json.error || "Unable to verify your billing state.");
        }

        const currentPlan =
          json.usage?.plan ??
          (json.subscription?.plan === "pro" || json.subscription?.plan === "agency"
            ? json.subscription.plan
            : "free");

        if (currentPlan === plan) {
          persistStoredPlan(plan);
          setPlan(plan);
        } else {
          setError(
            "Billing returned successfully, but the paid plan has not been confirmed in your account yet."
          );
        }
      } catch (upgradeError) {
        if (isMounted) {
          setError(
            upgradeError instanceof Error
              ? upgradeError.message
              : "Unable to verify your plan."
          );
        }
      } finally {
        clearPendingPlan();
        if (isMounted) {
          setIsComplete(true);
        }
      }
    }

    void completeUpgrade();

    return () => {
      isMounted = false;
    };
  }, [isReady, session?.access_token, setPlan]);

  return (
    <main className="empty-state stack">
      <p className="eyebrow">Upgrade</p>
      <h1>
        {isComplete ? (error ? "Upgrade needs attention." : `${planLabel} unlocked.`) : "Finalizing upgrade..."}
      </h1>
      <p>
        {isComplete
          ? error || `${planLabel} capabilities are now available for this account.`
          : "Applying your plan and syncing it to the intelligence system."}
      </p>
      <div className="button-row">
        <Link className="primary-button" href="/">
          Return to engine
        </Link>
      </div>
    </main>
  );
}
