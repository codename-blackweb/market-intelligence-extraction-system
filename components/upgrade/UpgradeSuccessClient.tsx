"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  clearPendingPlan,
  getOrCreateUserId,
  loadPendingPlan,
  persistStoredPlan
} from "@/lib/client-identity";

export default function UpgradeSuccessClient() {
  const [isReady, setIsReady] = useState(false);
  const [planLabel, setPlanLabel] = useState("Pro");

  useEffect(() => {
    let isMounted = true;

    async function completeUpgrade() {
      const userId = getOrCreateUserId();
      const plan = loadPendingPlan();
      setPlanLabel(plan === "agency" ? "Agency" : "Pro");
      persistStoredPlan(plan);

      try {
        await fetch("/api/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userId,
            plan
          })
        });
      } finally {
        clearPendingPlan();
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    void completeUpgrade();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="empty-state stack">
      <p className="eyebrow">Upgrade</p>
      <h1>{isReady ? `${planLabel} unlocked.` : "Finalizing upgrade..."}</h1>
      <p>
        {isReady
          ? `${planLabel} capabilities are now available for this user identity.`
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
