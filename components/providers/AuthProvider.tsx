"use client";

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  clearStoredAuthSession,
  loadStoredAuthSession,
  persistAuthSession
} from "@/lib/auth-session";
import type { AuthSession, UserPlan } from "@/types/market-analysis";

type AuthContextValue = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isReady: boolean;
  setSession: (session: AuthSession | null) => void;
  signOut: () => Promise<void>;
  plan: UserPlan;
  setPlan: (plan: UserPlan) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function derivePlan(session: AuthSession | null): UserPlan {
  if (!session) {
    return "free";
  }

  const rawPlan = (session.user as AuthSession["user"] & { plan?: UserPlan }).plan;
  return rawPlan === "pro" || rawPlan === "agency" ? rawPlan : "free";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [plan, setPlanState] = useState<UserPlan>("free");

  useEffect(() => {
    const storedSession = loadStoredAuthSession();
    setSessionState(storedSession);
    setPlanState(derivePlan(storedSession));
    setIsReady(true);
  }, []);

  const setSession = useCallback((nextSession: AuthSession | null) => {
    if (nextSession) {
      persistAuthSession(nextSession);
      setPlanState(derivePlan(nextSession));
    } else {
      clearStoredAuthSession();
      setPlanState("free");
    }

    setSessionState(nextSession);
  }, []);

  const setPlan = useCallback((nextPlan: UserPlan) => {
    setPlanState(nextPlan);

    setSessionState((currentSession) => {
      if (!currentSession) {
        return currentSession;
      }

      const nextSession = {
        ...currentSession,
        user: {
          ...currentSession.user,
          plan: nextPlan
        }
      } as AuthSession;

      persistAuthSession(nextSession);
      return nextSession;
    });
  }, []);

  const signOut = useCallback(async () => {
    const accessToken = session?.access_token;

    setSession(null);

    if (!accessToken) {
      return;
    }

    try {
      await fetch("/api/auth/signout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          accessToken
        })
      });
    } catch {
      // Session is already cleared locally.
    }
  }, [session?.access_token, setSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      isReady,
      setSession,
      signOut,
      plan,
      setPlan
    }),
    [isReady, plan, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
