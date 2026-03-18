// Simple localStorage-based session for member ID persistence.
// No full auth server exists in the backend — we store the memberId after registration.

const SESSION_KEY = "lotto_member_id";
const MEMBER_KEY = "lotto_member_data";

export function getSession(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export function setSession(memberId: string, memberData?: object): void {
  localStorage.setItem(SESSION_KEY, memberId);
  if (memberData) {
    localStorage.setItem(MEMBER_KEY, JSON.stringify(memberData));
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(MEMBER_KEY);
}

export function getMemberData<T>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(MEMBER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function updateMemberData(updates: object): void {
  const existing = getMemberData<object>() ?? {};
  localStorage.setItem(MEMBER_KEY, JSON.stringify({ ...existing, ...updates }));
}
