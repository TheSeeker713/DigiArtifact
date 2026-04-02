"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminSessionUser } from "@/lib/admin/types";

export function useAuth() {
  const [user, setUser] = useState<AdminSessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/admin/auth/me", { cache: "no-store" });
      if (response.status === 401) {
        setUser(null);
        return;
      }
      if (!response.ok) {
        throw new Error("Failed to load admin session.");
      }
      const data = (await response.json()) as { user: AdminSessionUser };
      setUser(data.user);
    } catch (err) {
      console.error(err);
      setError("Could not load admin session.");
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const response = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = (await response.json()) as {
      error?: string;
      user?: AdminSessionUser;
      mustChangePassword?: boolean;
    };
    if (!response.ok || !data.user) {
      throw new Error(data.error ?? "Login failed.");
    }
    const nextUser: AdminSessionUser = {
      ...data.user,
      mustChangePassword: Boolean(data.mustChangePassword),
    };
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const response = await fetch("/api/admin/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      throw new Error(data.error ?? "Password change failed.");
    }
    await refresh();
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    user,
    loading,
    error,
    login,
    logout,
    refresh,
    changePassword,
  };
}
