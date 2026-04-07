import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import VoteButton from "@/components/VoteButton";
import MarkdownContent from "@/components/MarkdownContent";
import CommentsThreadClient from "@/components/CommentsThreadClient";
import Link from "next/link";
import ReportButton from "@/components/ReportButton";

function relTime(d: Date | string) {
  const iso = typeof d === "string" ? d : d.toISOString();
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default async function IdeaDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const { rows } = await pool.query(
    `SELECT i.id,
            i.title,
            COALESCE(i.description, i."longDesc") AS description,
            COALESCE(i.category, 'Other') AS category,
            i."createdAt",
            COUNT(v.id)::int AS "voteCount",
            u.id AS "authorId",
            u.name AS "authorName",
            COALESCE(u.username, '') AS "authorUsername",
            u.avatar AS "authorAvatar"
     FROM "Idea" i
     JOIN "User" u ON u.id = i."userId"
     LEFT JOIN "Vote" v ON v."ideaId" = i.id
     WHERE i.id = $1
     GROUP BY i.id, u.id, u.name, u.username, u.avatar`,
    [id]
  );
  if (rows.length === 0) notFound();
  const idea = rows[0];

  let hasVoted = false;
  if (session?.user?.id) {
    const { rows: votedRows } = await pool.query(
      `SELECT id FROM "Vote" WHERE "userId" = $1 AND "ideaId" = $2 LIMIT 1`,
      [session.user.id, id]
    );
    hasVoted = votedRows.length > 0;
  }

  const { rows: comments } = await pool.query(
    `SELECT c.id, c.body, c."authorId", c."parentCommentId", c.upvotes, c."createdAt",
            u.name AS "authorName", COALESCE(u.username, '') AS "authorUsername", u.avatar AS "authorAvatar"
     FROM "Comment" c
     JOIN "User" u ON u.id = c."authorId"
     WHERE c."ideaId" = $1
     ORDER BY c.upvotes DESC, c."createdAt" DESC`,
    [id]
  );

  return (
    <main className="mx-auto w-full max-w-4xl">
      <article className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-3 inline-flex rounded-full border border-border bg-background px-2.5 py-1 text-xs uppercase tracking-wide text-accent">
          {idea.category}
        </div>
        <h1 className="text-3xl font-bold text-white">{idea.title}</h1>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted">
          {idea.authorAvatar ? (
            <Link href={`/u/${idea.authorUsername || idea.authorName}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={idea.authorAvatar} alt="" className="h-6 w-6 rounded-full object-cover" />
            </Link>
          ) : (
            <span className="h-6 w-6 rounded-full bg-white/10" />
          )}
          <Link href={`/u/${idea.authorUsername || idea.authorName}`} className="hover:text-white">
            @{idea.authorUsername || idea.authorName}
          </Link>
          <span>·</span>
          <span>{relTime(idea.createdAt)}</span>
        </div>
        <div className="mt-5">
          <MarkdownContent content={idea.description} />
        </div>
        <div className="mt-6">
          <VoteButton ideaId={idea.id} initialVoted={hasVoted} initialCount={idea.voteCount} />
        </div>
        {session?.user?.id ? (
          <div className="mt-3">
            <ReportButton targetType="idea" targetId={idea.id} />
          </div>
        ) : null}
      </article>

      <CommentsThreadClient
        entityId={idea.id}
        apiBasePath="/api/ideas"
        initialComments={comments.map((c) => ({
          ...c,
          createdAt: new Date(c.createdAt as Date).toISOString(),
        }))}
        sessionUserId={session?.user?.id ?? null}
      />
    </main>
  );
}
