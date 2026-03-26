import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import type { Status } from "@/lib/db";
import StatusBadge from "@/components/StatusBadge";
import DeleteIdeaButton from "@/components/DeleteIdeaButton";

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const { rows: userRows } = await pool.query(
        `SELECT id, name, email FROM "User" WHERE id = $1`,
        [session.user.id]
    );
    if (userRows.length === 0) redirect("/login");
    const user = userRows[0] as { id: string; name: string; email: string };

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

    const { rows: votesCastRows } = await pool.query(
        `SELECT COUNT(*)::int AS count FROM "Vote" WHERE "userId" = $1`,
        [session.user.id]
    );
    const votesCast = votesCastRows[0]?.count ?? 0;

    const totalIdeaVotes = ideas.reduce(
        (sum: number, idea: { voteCount: number }) => sum + idea.voteCount,
        0
    );

    return (
        <div className="mx-auto max-w-5xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="mt-1 text-muted">
                    Welcome back, {user.name}. Manage your submissions and track engagement.
                </p>
            </div>

            <div className="mb-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">Your ideas</p>
                    <p className="mt-2 text-2xl font-bold">{ideas.length}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">Votes received</p>
                    <p className="mt-2 text-2xl font-bold">{totalIdeaVotes}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">Votes cast</p>
                    <p className="mt-2 text-2xl font-bold">{votesCast}</p>
                </div>
            </div>

            <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-bold">Your Submissions</h2>
                <Link href="/submit" className="btn-primary !py-2 !px-4 text-sm">
                    Submit New Idea
                </Link>
            </div>

            {ideas.length === 0 ? (
                <div className="rounded-xl border border-border bg-card py-12 text-center">
                    <p className="mb-4 text-muted">You have not submitted any ideas yet.</p>
                    <Link
                        href="/submit"
                        className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent-hover"
                    >
                        Submit Your First Idea
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {ideas.map(
                        (idea: {
                            id: string;
                            title: string;
                            shortDesc: string;
                            status: Status;
                            voteCount: number;
                            createdAt: Date;
                        }) => (
                            <div
                                key={idea.id}
                                className="rounded-xl border border-border bg-card p-5"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-2 flex items-center gap-2">
                                            <Link
                                                href={`/idea/${idea.id}`}
                                                className="truncate text-lg font-semibold transition-colors hover:text-foreground"
                                            >
                                                {idea.title}
                                            </Link>
                                            <StatusBadge status={idea.status} />
                                        </div>
                                        <p className="mb-3 text-sm text-muted">{idea.shortDesc}</p>
                                        <p className="text-xs text-muted">
                                            {new Date(idea.createdAt).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}{" "}
                                            · {idea.voteCount} votes
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/idea/${idea.id}/edit`}
                                            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-card-hover"
                                        >
                                            Edit
                                        </Link>
                                        <DeleteIdeaButton ideaId={idea.id} redirectTo="/dashboard" />
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
}
