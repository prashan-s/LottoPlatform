"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  getSession,
  setSession,
  clearSession,
  getMemberData,
  updateMemberData,
} from "@/lib/session";
import type { Member } from "@/lib/types";

interface AuthContextValue {
  memberId: string | null;
  member: Member | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (id: string, memberData: Member) => void;
  logout: () => void;
  refreshMember: (data: Member) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMemberId(getSession());
    setMember(getMemberData<Member>());
    setLoading(false);
  }, []);

  const login = useCallback((id: string, memberData: Member) => {
    setSession(id, memberData);
    setMemberId(id);
    setMember(memberData);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setMemberId(null);
    setMember(null);
  }, []);

  const refreshMember = useCallback((data: Member) => {
    updateMemberData(data);
    setMember(data);
  }, []);

  return (
    <AuthContext.Provider
      value={{ memberId, member, isAuthenticated: !!memberId, loading, login, logout, refreshMember }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
