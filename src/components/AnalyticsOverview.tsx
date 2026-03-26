"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { TrendingIdeaResult } from "@/lib/trending";

interface AnalyticsOverviewProps {
    topVoteCount: number;
    conversionPct: number;
    ideasCount: number;
    topThreeVotes: number;
    totalVotes: number;
    yourIdeas: number;
    trendingPick: TrendingIdeaResult | null;
}

export default function AnalyticsOverview({
    topVoteCount,
    conversionPct,
    ideasCount,
    topThreeVotes,
    totalVotes,
    yourIdeas,
    trendingPick,
}: AnalyticsOverviewProps) {
    const router = useRouter();
    const [showWidgets, setShowWidgets] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const topShare = useMemo(() => {
        if (!totalVotes) return 0;
        return Math.round((topVoteCount / totalVotes) * 100);
    }, [topVoteCount, totalVotes]);

    async function handleRefresh() {
        setRefreshing(true);
        router.refresh();
        setTimeout(() => setRefreshing(false), 700);
    }

    return (
        <section className="mb-10 analytics-shell p-5 md:p-6">
            <div className="mb-4 flex items-center justify-end gap-2">
                <div className="flex items-center gap-2">
                    <button type="button" onClick={handleRefresh} className="pill-dark">
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowWidgets((v) => !v)}
                        className="pill-dark"
                    >
                        {showWidgets ? "Hide widgets" : "Widgets"}
                    </button>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-12">
                <div className="space-y-3 lg:col-span-5">
                    <div className="analytics-pink p-4">
                        <p className="text-xs font-medium opacity-80">Top idea momentum</p>
                        <p className="mt-2 text-4xl font-extrabold">+{conversionPct}%</p>
                        <p className="mt-2 text-xs opacity-75">
                            Based on current vote concentration on the highest-ranked submission.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="analytics-card-soft p-3">
                            <p className="text-[11px] uppercase tracking-wide text-muted">Ideas</p>
                            <p className="mt-1 text-xl font-bold text-foreground">{ideasCount}</p>
                        </div>
                        <div className="analytics-card-soft p-3">
                            <p className="text-[11px] uppercase tracking-wide text-muted">Top 3 votes</p>
                            <p className="mt-1 text-xl font-bold text-foreground">{topThreeVotes}</p>
                        </div>
                        <div className="analytics-card-soft p-3">
                            <p className="text-[11px] uppercase tracking-wide text-muted">Total votes</p>
                            <p className="mt-1 text-xl font-bold text-foreground">{totalVotes}</p>
                        </div>
                        <div className="analytics-card-soft p-3">
                            <p className="text-[11px] uppercase tracking-wide text-muted">Your ideas</p>
                            <p className="mt-1 text-xl font-bold text-foreground">{yourIdeas}</p>
                        </div>
                    </div>

                    {showWidgets && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="analytics-card-soft p-3">
                                <p className="text-[11px] uppercase tracking-wide text-muted">Top share</p>
                                <p className="mt-1 text-xl font-bold text-foreground">{topShare}%</p>
                            </div>
                            <div className="analytics-card-soft p-3">
                                <p className="text-[11px] uppercase tracking-wide text-muted">Engagement</p>
                                <p className="mt-1 text-xl font-bold text-foreground">
                                    {ideasCount ? (totalVotes / ideasCount).toFixed(1) : "0.0"}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="analytics-card p-4 lg:col-span-7">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h2 className="text-xl font-bold text-foreground">
                                Most Trending Idea
                            </h2>
                        </div>
                        <span className="pill-dark">Recency + Popularity</span>
                    </div>

                    {!trendingPick ? (
                        <p className="text-sm text-muted">No ideas yet to evaluate trending.</p>
                    ) : (
                        <div className="rounded-xl border border-border bg-card p-4">
                            <div className="mb-2 flex items-center gap-2">
                                <Link
                                    href={`/idea/${trendingPick.idea.id}`}
                                    className="text-lg font-semibold text-foreground transition-colors hover:text-muted"
                                >
                                    {trendingPick.idea.title}
                                </Link>
                                <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-foreground">
                                    Trending Score {trendingPick.score.toFixed(2)}
                                </span>
                            </div>
                            <p className="mb-3 text-sm text-muted">{trendingPick.idea.shortDesc}</p>
                            <p className="text-xs text-muted">
                                {trendingPick.idea.voteCount} votes · submitted{" "}
                                {new Date(trendingPick.idea.createdAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                })}
                            </p>
                        </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                        <a href="#submit" className="btn-primary !px-4 !py-2.5 text-sm">
                            Submit Idea
                        </a>
                        <a href="#ideas" className="btn-secondary !px-4 !py-2.5 text-sm">
                            Browse Ideas
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
