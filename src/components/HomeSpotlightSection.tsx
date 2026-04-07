import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import type { Status } from "@/lib/db";

export interface SpotlightIdea {
    id: string;
    title: string;
    shortDesc: string;
    status: Status;
    voteCount: number;
    authorName: string;
}

const ROADMAP: { label: string; status: "done" | "in-progress" | "planned" }[] = [
    { label: "Two-factor authentication (2FA)", status: "planned" },
    { label: "Validated email & display name on sign-up", status: "done" },
    { label: "Sensible text limits for ideas & AI generation", status: "done" },
    { label: "SQL injection protection (parameterized queries)", status: "done" },
    { label: "Community hub for product feedback", status: "done" },
    { label: "Connect contributors with ideas (open to help)", status: "done" },
];

function RoadmapPill({ status }: { status: (typeof ROADMAP)[number]["status"] }) {
    const label =
        status === "done" ? "Done" : status === "in-progress" ? "In progress" : "Planned";
    const cls =
        status === "done"
            ? "bg-success/20 text-foreground"
            : status === "in-progress"
              ? "bg-accent/25 text-foreground"
              : "bg-card-hover text-muted";
    return (
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}>
            {label}
        </span>
    );
}

interface HomeSpotlightSectionProps {
    topIdeas: SpotlightIdea[];
    ideasCount: number;
    totalVotes: number;
}

export default function HomeSpotlightSection({
    topIdeas,
    ideasCount,
    totalVotes,
}: HomeSpotlightSectionProps) {
    if (ideasCount === 0) {
        return (
            <section id="spotlight" className="scroll-mt-28 mb-10">
                <h2 className="text-2xl font-bold tracking-tight">Spotlight</h2>
                <div className="mt-6 rounded-2xl border border-border bg-card px-6 py-12 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/30">
                        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden>
                            <path d="M9 18h6M10 22h4M8.5 14.5A6 6 0 1 1 15.5 14.5c-.9.7-1.5 1.8-1.5 2.95V18h-4v-.55c0-1.15-.6-2.25-1.5-2.95Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h3 className="text-[1.1rem] font-semibold text-white">No ideas yet — be the first</h3>
                    <p className="mx-auto mt-2 max-w-xl text-sm text-white/50">
                        Submit an idea from the workspace below. The community will vote, discuss, and decide what gets built.
                    </p>
                    <div className="mt-5">
                        <Link href="#submit" className="btn-primary magnetic-btn !px-4 !py-2 text-sm">
                            Submit the first idea →
                        </Link>
                    </div>
                    <div className="mt-8 grid gap-3 sm:grid-cols-3">
                        {[0, 1, 2].map((card) => (
                            <div key={card} className="rounded-xl border border-white/10 bg-white/5 p-4 blur-[2px]" style={{ opacity: 0.15 }}>
                                <div className="h-2.5 w-14 rounded-full bg-white/40" />
                                <div className="mt-3 h-3.5 w-3/4 rounded-full bg-white/40" />
                                <div className="mt-2 h-3 w-full rounded-full bg-white/30" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="spotlight" className="scroll-mt-28 mb-10">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Spotlight</h2>
                    <p className="mt-1 text-sm text-muted">
                        Highest-voted ideas right now, plus what we are building next.
                    </p>
                </div>
                <p className="text-xs font-medium text-muted">
                    {ideasCount} ideas · {totalVotes} votes
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-7">
                    <div className="mb-3">
                        <h3 className="text-sm font-bold uppercase tracking-wide text-muted">Top ideas</h3>
                    </div>
                    {topIdeas.length === 0 ? (
                        <div className="rounded-2xl border border-border bg-card/80 p-8 text-center text-sm text-muted">
                            No ideas yet — be the first to submit.
                        </div>
                    ) : (
                        <ul className="flex flex-col gap-3">
                            {topIdeas.map((idea, i) => (
                                <li key={idea.id}>
                                    <Link
                                        href={`/idea/${idea.id}`}
                                        className="block rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-muted hover:shadow-md"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                                    <span className="text-xs font-bold text-muted">#{i + 1}</span>
                                                    <h4 className="font-semibold text-foreground">{idea.title}</h4>
                                                    <StatusBadge status={idea.status} />
                                                </div>
                                                <p className="line-clamp-2 text-sm text-muted">{idea.shortDesc}</p>
                                                <p className="mt-2 text-xs text-muted">
                                                    {idea.authorName} · {idea.voteCount} votes
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="lg:col-span-5">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-wide text-muted">Product roadmap</h3>
                        <Link href="/community" className="text-xs font-semibold text-foreground hover:text-muted">
                            Community →
                        </Link>
                    </div>
                    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                        <ul className="space-y-3">
                            {ROADMAP.map((item) => (
                                <li
                                    key={item.label}
                                    className="flex items-start justify-between gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0"
                                >
                                    <span className="text-sm leading-snug text-foreground">{item.label}</span>
                                    <RoadmapPill status={item.status} />
                                </li>
                            ))}
                        </ul>
                        <p className="mt-4 text-xs leading-relaxed text-muted">
                            Security note: all database access uses parameterized queries (no string-concatenated SQL)
                            to mitigate SQL injection.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
