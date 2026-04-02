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
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { isSupabaseConfigured, normalizeAuthSession } from "@/lib/supabase-core";
import type { AuthSession, UserPlan } from "@/types/market-analysis";

type AuthContextValue = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isReady: boolean;
  setSession: (session: AuthSession | null) => Promise<void>;
  signOut: () => Promise<void>;
  plan: UserPlan;
  setPlan: (plan: UserPlan) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [plan, setPlanState] = useState<UserPlan>("free");

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSessionState(null);
      setPlanState("free");
      setIsReady(true);
      return;
    }

    const client = getSupabaseBrowserClient();

    if (!client) {
      setIsReady(true);
      return;
    }

    let isMounted = true;

    void client.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setSessionState(normalizeAuthSession(data.session));
      setIsReady(true);
    });

    const {
      data: { subscription }
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return;
      }

      setSessionState(normalizeAuthSession(nextSession));
      if (!nextSession) {
        setPlanState("free");
      }
      setIsReady(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const setSession = useCallback(async (nextSession: AuthSession | null) => {
    const client = getSupabaseBrowserClient();

    if (!client) {
      setSessionState(nextSession);
      setPlanState(nextSession ? plan : "free");
      return;
    }

    if (!nextSession) {
      await client.auth.signOut();
      setSessionState(null);
      setPlanState("free");
      return;
    }

    if (nextSession.refresh_token) {
      const { data, error } = await client.auth.setSession({
        access_token: nextSession.access_token,
        refresh_token: nextSession.refresh_token
      });

      if (error) {
        throw error;
      }

      setSessionState(normalizeAuthSession(data.session) ?? nextSession);
      return;
    }

    setSessionState(nextSession);
  }, [plan]);

  const setPlan = useCallback((nextPlan: UserPlan) => {
    setPlanState(nextPlan);
  }, []);

  const signOut = useCallback(async () => {
    const client = getSupabaseBrowserClient();

    setSessionState(null);
    setPlanState("free");

    if (!client) {
      return;
    }

    await client.auth.signOut();
  }, []);

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
    [isReady, plan, session, setSession, signOut, setPlan]
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
