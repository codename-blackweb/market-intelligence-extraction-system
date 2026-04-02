"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { clearPendingPlan, loadPendingPlan, persistStoredPlan } from "@/lib/client-identity";

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
      if (!session?.access_token) {
        setError("Sign in again to finish applying your plan.");
        setIsComplete(true);
        return;
      }

      const plan = loadPendingPlan();
      setPlanLabel(plan === "agency" ? "Agency" : "Pro");

      try {
        const response = await fetch("/api/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            plan
          })
        });
        const json = (await response.json()) as {
          success: boolean;
          error?: string;
        };

        if (!response.ok || !json.success) {
          throw new Error(json.error || "Unable to apply your plan.");
        }

        persistStoredPlan(plan);
        setPlan(plan);
      } catch (upgradeError) {
        if (isMounted) {
          setError(
            upgradeError instanceof Error ? upgradeError.message : "Unable to apply your plan."
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
