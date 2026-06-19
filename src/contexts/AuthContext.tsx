import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserStatus = "pending" | "approved" | "rejected" | null;

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  accessDenied: boolean;
  userStatus: UserStatus;
  statusLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<UserStatus>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      setUserStatus(null);
      return;
    }
    setStatusLoading(true);
    supabase
      .from("user_roles")
      .select("status")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        setUserStatus((data?.status as UserStatus) ?? null);
        setStatusLoading(false);
      });
  }, [session?.user?.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, accessDenied: false, userStatus, statusLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
