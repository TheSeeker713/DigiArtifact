"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/admin/useAuth";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto flex min-h-screen max-w-md items-center px-4 text-[#9b9484]">Loading...</div>}>
      <AdminLoginPageInner />
    </Suspense>
  );
}

function AdminLoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin/today";
  const mustChangeParam = searchParams.get("mustChange") === "1";

  const { user, login, changePassword } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const mustChange = Boolean(user?.mustChangePassword || mustChangeParam);

  useEffect(() => {
    if (user && !user.mustChangePassword) {
      router.replace(next);
    }
  }, [next, router, user]);

  const onLogin = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const sessionUser = await login(username, password);
      if (!sessionUser.mustChangePassword) {
        router.replace(next);
      } else {
        setCurrentPassword(password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log in.");
    } finally {
      setSubmitting(false);
    }
  };

  const onChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await changePassword(currentPassword, newPassword);
      router.replace("/admin/today");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <div className="w-full rounded-2xl border border-[#3a3628] bg-[#23211a] p-6 shadow-2xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#c9a84c]">KAIA</p>
        <h1 className="mt-2 text-3xl font-semibold">
          {mustChange ? "Change your temporary password" : "Sign in to admin"}
        </h1>
        <p className="mt-2 text-sm text-[#9b9484]">
          {mustChange
            ? "First login requires a permanent password before admin actions are enabled."
            : "Private dashboard access for DigiArtifact admin users only."}
        </p>

        {mustChange ? (
          <form className="mt-6 space-y-3" onSubmit={onChangePassword}>
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-md border border-[#3a3628] bg-[#1a1812] px-3 py-2 outline-none focus:border-[#c9a84c]"
            />
            <input
              type="password"
              placeholder="New password (min 10 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-md border border-[#3a3628] bg-[#1a1812] px-3 py-2 outline-none focus:border-[#c9a84c]"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-[#c9a84c] px-3 py-2 font-medium text-[#1a1812] disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Set new password"}
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-3" onSubmit={onLogin}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-[#3a3628] bg-[#1a1812] px-3 py-2 outline-none focus:border-[#c9a84c]"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-[#3a3628] bg-[#1a1812] px-3 py-2 outline-none focus:border-[#c9a84c]"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-[#c9a84c] px-3 py-2 font-medium text-[#1a1812] disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        )}

        {error ? (
          <p className="mt-4 rounded-md border border-red-700/40 bg-red-900/20 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
