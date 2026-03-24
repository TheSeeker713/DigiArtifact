"use client";

import { useEffect, useState } from "react";

type ArchivePayload = {
  migrationStatus: string;
  itemCount?: number;
  archive?: {
    id: string;
    sourceVersion: string;
    createdAt: string;
  } | null;
};

export default function ArchiveDebugPage() {
  const [payload, setPayload] = useState<ArchivePayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/checklist/archive", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load archive status.");
        }
        const data = (await response.json()) as ArchivePayload;
        setPayload(data);
      } catch (err) {
        console.error(err);
        setError("Could not load archive debug data.");
      }
    };
    void load();
  }, []);

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 py-6">
      <h1 className="text-xl font-semibold">Archive Debug</h1>
      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      {!error && !payload ? <p className="mt-3 text-sm text-neutral-500">Loading...</p> : null}
      {payload ? (
        <pre className="mt-4 overflow-auto rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs">
          {JSON.stringify(payload, null, 2)}
        </pre>
      ) : null}
    </main>
  );
}
