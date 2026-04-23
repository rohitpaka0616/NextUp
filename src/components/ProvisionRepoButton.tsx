"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  ideaId: string;
}

export default function ProvisionRepoButton({ ideaId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createRepo() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/ideas/${ideaId}`, { method: "POST" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to create repository.");
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to create repository.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={createRepo}
        disabled={loading}
        className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-card-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Creating repo..." : "Create GitHub repo"}
      </button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
