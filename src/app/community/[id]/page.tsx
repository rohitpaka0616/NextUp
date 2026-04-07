import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import MarkdownContent from "@/components/MarkdownContent";
import CommentsThreadClient from "@/components/CommentsThreadClient";
import Link from "next/link";

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

export default async function CommunityPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const { rows: postRows } = await pool.query(
    `SELECT p.id, p.title, p.body, p.tag, p."createdAt",
            u.name AS "authorName", COALESCE(u.username, '') AS "authorUsername", u.avatar AS "authorAvatar"
     FROM "CommunityPost" p
     JOIN "User" u ON u.id = p."authorId"
     WHERE p.id = $1`,
    [id]
  );
  if (postRows.length === 0) notFound();
  const post = postRows[0];

  const { rows: comments } = await pool.query(
    `SELECT c.id, c.body, c."authorId", c."parentCommentId", c.upvotes, c."createdAt",
            u.name AS "authorName", COALESCE(u.username, '') AS "authorUsername", u.avatar AS "authorAvatar"
     FROM "Comment" c
     JOIN "User" u ON u.id = c."authorId"
     WHERE c."postId" = $1
     ORDER BY c.upvotes DESC, c."createdAt" DESC`,
    [id]
  );

  return (
    <main className="mx-auto w-full max-w-4xl">
      <article className="rounded-2xl border border-border bg-card p-6">
        <p className="mb-2 inline-flex rounded-full border border-border bg-background px-2 py-1 text-xs uppercase tracking-wide text-accent">
          {post.tag}
        </p>
        <h1 className="text-3xl font-bold text-white">{post.title}</h1>
        <div className="mt-2 text-xs text-muted">
          <Link href={`/u/${post.authorUsername || post.authorName}`} className="hover:text-white">
            @{post.authorUsername || post.authorName}
          </Link>{" "}
          · {relTime(post.createdAt)}
        </div>
        <div className="mt-5">
          <MarkdownContent content={post.body} />
        </div>
      </article>

      <CommentsThreadClient
        entityId={post.id}
        apiBasePath="/api/community"
        initialComments={comments.map((c) => ({ ...c, createdAt: new Date(c.createdAt as Date).toISOString() }))}
        sessionUserId={session?.user?.id ?? null}
      />
    </main>
  );
}
