import React, { createContext, useContext, useState, useCallback } from "react";
import { members, Member } from "./crm-data";

export type RoleKey = "admin" | "manager" | "commercial";

export interface AuthUser {
  name: string;
  email: string;
  role: RoleKey;
  team: string;
  initials: string;
  member: Member;
}

interface AuthContextType {
  user: AuthUser | null;
  role: RoleKey;
  isRole: (...roles: RoleKey[]) => boolean;
  canEditActivity: (activityOrOwner: string | { owner?: string }) => boolean;
  canManageUsers: boolean;
  canAccessSettings: boolean;
  refreshUser: () => void;
}

const SESSION_MAX_AGE = 12 * 60 * 60 * 1000;

const AuthContext = createContext<AuthContextType | null>(null);

function readFromStorage(key: string): string | null {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
}

function mapFrenchRole(role: string): RoleKey {
  if (role === "Administrateur" || role === "admin") return "admin";
  if (role === "Manager" || role === "manager") return "manager";
  return "commercial";
}

export function getStoredUser(): AuthUser | null {
  const token = readFromStorage("token");
  const loginTime = readFromStorage("login_time");
  const storedRole = readFromStorage("role") || "commercial";
  const storedName = readFromStorage("name") || "Utilisateur";

  if (!token) return null;

  if (loginTime && Date.now() - parseInt(loginTime, 10) > SESSION_MAX_AGE) {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("login_time");
    sessionStorage.clear();
    return null;
  }

  const role = mapFrenchRole(storedRole);
  const member = members.find(
    (m) => m.name === storedName || m.email.toLowerCase() === storedName.toLowerCase(),
  );

  return {
    name: storedName,
    email: member?.email || "",
    role,
    team: member?.team || "Non assigné",
    initials: member?.initials || storedName.slice(0, 2).toUpperCase(),
    member:
      member ||
      ({
        id: "unknown",
        name: storedName,
        role: role === "admin" ? "Administrateur" : role === "manager" ? "Manager" : "Commercial",
        email: "",
        phone: "",
        team: "Non assigné",
        status: "Actif",
        initials: storedName.slice(0, 2).toUpperCase(),
        lastActive: new Date().toISOString(),
      } as Member),
  };
}

const EMPTY_AUTH: AuthContextType = {
  user: null,
  role: "commercial",
  isRole: () => false,
  canEditActivity: () => false,
  canManageUsers: false,
  canAccessSettings: false,
  refreshUser: () => {},
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());

  const refreshUser = useCallback(() => {
    setUser(getStoredUser());
  }, []);

  if (!user) {
    return (
      <AuthContext.Provider value={{ ...EMPTY_AUTH, refreshUser }}>{children}</AuthContext.Provider>
    );
  }

  const isRole = (...roles: RoleKey[]) => roles.includes(user.role);

  const canEditActivity = (activityOrOwner: string | { owner?: string }) => {
    const owner =
      typeof activityOrOwner === "string" ? activityOrOwner : activityOrOwner.owner || "";
    return user.role === "admin" || user.role === "manager" || owner === user.name;
  };

  const value: AuthContextType = {
    user,
    role: user.role,
    isRole,
    canEditActivity,
    canManageUsers: user.role === "admin" || user.role === "manager",
    canAccessSettings: user.role === "admin",
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
