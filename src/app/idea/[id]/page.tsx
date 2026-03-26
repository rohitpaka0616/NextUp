import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import type { Status } from "@/lib/db";
import StatusBadge from "@/components/StatusBadge";
import VoteButton from "@/components/VoteButton";
import StatusChanger from "@/components/StatusChanger";
import Link from "next/link";
import DeleteIdeaButton from "@/components/DeleteIdeaButton";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function IdeaDetailPage({ params }: Props) {
    const { id } = await params;
    const session = await auth();

    const { rows } = await pool.query(
        `SELECT i.*, u.name AS "authorName",
                COUNT(v.id)::int AS "voteCount"
         FROM "Idea" i
         JOIN "User" u ON u.id = i."userId"
         LEFT JOIN "Vote" v ON v."ideaId" = i.id
         WHERE i.id = $1
         GROUP BY i.id, u.name`,
        [id]
    );

    if (rows.length === 0) notFound();

    const idea = rows[0] as {
        id: string;
        title: string;
        shortDesc: string;
        longDesc: string;
        status: Status;
        createdAt: Date;
        userId: string;
        authorName: string;
        voteCount: number;
    };

    const isAdmin = session?.user?.email === process.env.ADMIN_EMAIL;
    const isOwner = session?.user?.id === idea.userId;

    // Check if the current user has voted
    let hasVoted = false;
    if (session?.user?.id) {
        const { rows: voteRows } = await pool.query(
            `SELECT id FROM "Vote" WHERE "userId" = $1 AND "ideaId" = $2`,
            [session.user.id, id]
        );
        hasVoted = voteRows.length > 0;
    }

    return (
        <div className="mx-auto max-w-3xl">
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <div className="mb-2 flex items-center gap-3">
                        <h1 className="text-3xl font-bold">{idea.title}</h1>
                        <StatusBadge status={idea.status} />
                    </div>
                    <p className="text-sm text-muted">
                        by <span className="text-foreground">{idea.authorName}</span> ·{" "}
                        {new Date(idea.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                        })}
                    </p>
                    {isAdmin && (
                        <div className="mt-3">
                            <StatusChanger ideaId={idea.id} currentStatus={idea.status} />
                        </div>
                    )}
                </div>
                {isOwner && (
                    <div className="flex items-start gap-2">
                        <Link
                            href={`/idea/${idea.id}/edit`}
                            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-card-hover"
                        >
                            Edit
                        </Link>
                        <DeleteIdeaButton ideaId={idea.id} />
                    </div>
                )}
            </div>

            <div className="mb-8 rounded-xl border border-border bg-card p-6">
                <p className="mb-4 text-lg font-medium text-foreground/90">
                    {idea.shortDesc}
                </p>
                <div className="whitespace-pre-wrap leading-relaxed text-muted">
                    {idea.longDesc}
                </div>
            </div>

            <VoteButton
                ideaId={idea.id}
                initialVoted={hasVoted}
                initialCount={idea.voteCount}
            />
        </div>
    );
}
