"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IDEA_INTEREST_NOTE_MAX } from "@/lib/limits";

interface IdeaInterestPanelProps {
    ideaId: string;
    isLoggedIn: boolean;
    initialCount: number;
    initialSampleNames: string[];
    initialInterested: boolean;
    setupRequired: boolean;
}

export default function IdeaInterestPanel({
    ideaId,
    isLoggedIn,
    initialCount,
    initialSampleNames,
    initialInterested,
    setupRequired,
}: IdeaInterestPanelProps) {
    const router = useRouter();
    const [count, setCount] = useState(initialCount);
    const [interested, setInterested] = useState(initialInterested);
    const [names, setNames] = useState(initialSampleNames);
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function toggle() {
        if (!isLoggedIn || setupRequired) return;
        setError("");
        setLoading(true);
        try {
            if (interested) {
                const res = await fetch(`/api/ideas/${ideaId}/interest`, { method: "DELETE" });
                const data = await res.json();
                if (!res.ok) {
                    setError(data.error || "Could not update");
                    return;
                }
                setInterested(false);
                setCount((c) => Math.max(0, c - 1));
                router.refresh();
            } else {
                const res = await fetch(`/api/ideas/${ideaId}/interest`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ note: note.trim() || undefined }),
                });
                const data = await res.json();
                if (!res.ok) {
                    setError(data.error || "Could not save");
                    return;
                }
                setInterested(true);
                setCount((c) => c + 1);
                setNote("");
                router.refresh();
            }
        } finally {
            setLoading(false);
        }
    }

    if (setupRequired) {
        return (
            <div className="rounded-xl border border-border bg-card/80 p-4 text-sm text-muted">
                Collaboration signup is not enabled until the database migration is applied (
                <code className="text-xs">db/migrations/002_community_and_interest.sql</code>).
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-muted">Open to help</h3>
            <p className="mb-4 text-sm text-muted">
                Offer to contribute build time or skills to this idea. The author can reach out via the community.
            </p>

            {error && (
                <p className="mb-3 text-sm text-danger" role="alert">
                    {error}
                </p>
            )}

            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold text-foreground">{count}</span>
                <span className="text-muted">{count === 1 ? "person is" : "people are"} open to help</span>
            </div>

            {names.length > 0 && (
                <p className="mb-4 text-xs text-muted">
                    Includes: {names.slice(0, 8).join(", ")}
                    {names.length > 8 ? "…" : ""}
                </p>
            )}

            {!isLoggedIn ? (
                <a href="/auth/signin" className="btn-primary inline-flex !py-2 !px-4 text-sm">
                    Sign in to vote, comment or submit
                </a>
            ) : (
                <>
                    {!interested && (
                        <div className="mb-3">
                            <label htmlFor="interest-note" className="mb-1 block text-xs font-medium text-muted">
                                Optional note (skills, availability)
                            </label>
                            <input
                                id="interest-note"
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                maxLength={IDEA_INTEREST_NOTE_MAX}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                placeholder="e.g. Frontend, weekends"
                            />
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={toggle}
                        disabled={loading}
                        className={
                            interested
                                ? "btn-secondary !py-2 !px-4 text-sm disabled:opacity-50"
                                : "btn-primary !py-2 !px-4 text-sm disabled:opacity-50"
                        }
                    >
                        {loading ? "…" : interested ? "Withdraw offer" : "I can help build this"}
                    </button>
                </>
            )}
        </div>
    );
}
