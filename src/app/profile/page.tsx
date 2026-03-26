import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import type { Status } from "@/lib/db";
import StatusBadge from "@/components/StatusBadge";

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    // Fetch user info
    const { rows: userRows } = await pool.query(
        `SELECT id, name, email, "createdAt" FROM "User" WHERE id = $1`,
        [session.user.id]
    );
    if (userRows.length === 0) redirect("/login");
    const user = userRows[0];

    // Fetch user's ideas with vote counts
    const { rows: ideas } = await pool.query(
        `SELECT i.id, i.title, i."shortDesc", i.status, i."createdAt",
                COUNT(v.id)::int AS "voteCount"
         FROM "Idea" i
         LEFT JOIN "Vote" v ON v."ideaId" = i.id
         WHERE i."userId" = $1
         GROUP BY i.id
         ORDER BY i."createdAt" DESC`,
        [session.user.id]
    );

    // Count total votes cast by user
    const { rows: voteCountRows } = await pool.query(
        `SELECT COUNT(*)::int AS count FROM "Vote" WHERE "userId" = $1`,
        [session.user.id]
    );
    const votesCast = voteCountRows[0].count;

    // Fetch ideas this user voted on (newest vote first)
    const { rows: votedIdeas } = await pool.query(
        `SELECT i.id, i.title, i."shortDesc", i.status, i."createdAt",
                u.name AS "authorName",
                v."createdAt" AS "votedAt"
         FROM "Vote" v
         JOIN "Idea" i ON i.id = v."ideaId"
         JOIN "User" u ON u.id = i."userId"
         WHERE v."userId" = $1
         ORDER BY v."createdAt" DESC`,
        [session.user.id]
    );

    return (
        <div className="mx-auto max-w-3xl">
            <div className="mb-10">
                <h1 className="mb-1 text-3xl font-bold">{user.name}</h1>
                <p className="text-muted">{user.email}</p>
                <div className="mt-3 flex gap-4 text-sm text-muted">
                    <span>
                        <span className="font-semibold text-foreground">
                            {ideas.length}
                        </span>{" "}
                        ideas submitted
                    </span>
                    <span>
                        <span className="font-semibold text-foreground">
                            {votesCast}
                        </span>{" "}
                        votes cast
                    </span>
                </div>
            </div>

            <h2 className="mb-4 text-xl font-bold">Your Ideas</h2>

            {ideas.length === 0 ? (
                <div className="rounded-xl border border-border bg-card py-12 text-center">
                    <p className="mb-4 text-muted">You haven&apos;t submitted any ideas yet.</p>
                    <Link
                        href="/submit"
                        className="mt-2 inline-flex text-sm font-semibold text-foreground transition-colors hover:text-muted"
                    >
                        Submit Your First Idea
                    </Link>
                </div>
            ) : (
                <div className="mb-10 flex flex-col gap-3">
                    {ideas.map((idea: { id: string; title: string; shortDesc: string; status: Status; voteCount: number; createdAt: Date }) => (
                        <Link
                            key={idea.id}
                            href={`/idea/${idea.id}`}
                            className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-accent/40 hover:bg-card-hover"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="truncate font-semibold transition-colors group-hover:text-foreground">
                                        {idea.title}
                                    </h3>
                                    <StatusBadge status={idea.status} />
                                </div>
                                <p className="mt-1 truncate text-sm text-muted">
                                    {idea.shortDesc}
                                </p>
                                <p className="mt-1 text-xs text-muted">
                                    Submitted{" "}
                                    {new Date(idea.createdAt).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>
                            <div className="ml-4 flex flex-col items-center rounded-lg bg-accent/10 px-3 py-1.5">
                                <span className="text-lg font-bold text-foreground">
                                    {idea.voteCount}
                                </span>
                                <span className="text-[10px] font-medium uppercase tracking-wider text-muted">
                                    votes
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <h2 className="mb-4 text-xl font-bold">Ideas You Voted On</h2>
            {votedIdeas.length === 0 ? (
                <div className="rounded-xl border border-border bg-card py-10 text-center">
                    <p className="text-muted">
                        You have not voted on any ideas yet.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {votedIdeas.map(
                        (idea: {
                            id: string;
                            title: string;
                            shortDesc: string;
                            status: Status;
                            authorName: string;
                            votedAt: Date;
                        }) => (
                            <Link
                                key={`${idea.id}-${idea.votedAt}`}
                                href={`/idea/${idea.id}`}
                                className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-accent/40 hover:bg-card-hover"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="truncate font-semibold transition-colors group-hover:text-foreground">
                                                {idea.title}
                                            </h3>
                                            <StatusBadge status={idea.status} />
                                        </div>
                                        <p className="mt-1 truncate text-sm text-muted">
                                            {idea.shortDesc}
                                        </p>
                                        <p className="mt-1 text-xs text-muted">
                                            by {idea.authorName} · voted{" "}
                                            {new Date(idea.votedAt).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </p>
                                    </div>
                                    <span className="text-xs font-medium text-muted">Voted</span>
                                </div>
                            </Link>
                        )
                    )}
                </div>
            )}
        </div>
    );
}
