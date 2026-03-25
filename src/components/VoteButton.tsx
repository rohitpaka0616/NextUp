"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface VoteButtonProps {
    ideaId: string;
    initialVoted: boolean;
    initialCount: number;
}

export default function VoteButton({
    ideaId,
    initialVoted,
    initialCount,
}: VoteButtonProps) {
    const router = useRouter();
    const [voted, setVoted] = useState(initialVoted);
    const [count, setCount] = useState(initialCount);
    const [isPending, startTransition] = useTransition();

    async function handleVote() {
        // Optimistic update
        setVoted((v) => !v);
        setCount((c) => (voted ? c - 1 : c + 1));

        try {
            const res = await fetch(`/api/ideas/${ideaId}/vote`, { method: "POST" });
            if (!res.ok) {
                // Revert optimistic update
                setVoted((v) => !v);
                setCount((c) => (voted ? c + 1 : c - 1));

                if (res.status === 401) {
                    router.push("/login");
                }
                return;
            }

            startTransition(() => {
                router.refresh();
            });
        } catch {
            // Revert on network error
            setVoted((v) => !v);
            setCount((c) => (voted ? c + 1 : c - 1));
        }
    }

    return (
        <button
            onClick={handleVote}
            disabled={isPending}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-6 py-3 text-sm font-semibold transition-all duration-200 ${voted
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border bg-card text-muted hover:border-accent/40 hover:text-foreground"
                } disabled:opacity-50`}
        >
            <svg
                className={`h-5 w-5 transition-transform duration-200 ${voted ? "scale-110" : ""}`}
                fill={voted ? "currentColor" : "none"}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 15l7-7 7 7"
                />
            </svg>
            <span>{voted ? "Voted" : "Vote"}</span>
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs font-bold">
                {count}
            </span>
        </button>
    );
}
