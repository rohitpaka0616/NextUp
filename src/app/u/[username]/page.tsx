import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import ProfileHeaderClient from "@/components/ProfileHeaderClient";

type Tab = "ideas" | "comments" | "voted";

function relTime(iso: string | Date) {
  const d = new Date(iso);
  const ms = Date.now() - d.getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  const { username } = await params;
  const { tab } = await searchParams;
  const activeTab: Tab = tab === "comments" || tab === "voted" ? tab : "ideas";

  const { rows: userRows } = await pool.query(
    `SELECT id, name, username, avatar, bio, "createdAt" FROM "User" WHERE username = $1 LIMIT 1`,
    [username]
  );
  if (userRows.length === 0) notFound();
  const user = userRows[0] as {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    bio: string;
    createdAt: Date;
  };
  const isOwner = session?.user?.id === user.id;

  const [ideasRes, votesCastRes, commentsCountRes] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS count FROM "Idea" WHERE "userId" = $1`, [user.id]),
    pool.query(`SELECT COUNT(*)::int AS count FROM "Vote" WHERE "userId" = $1`, [user.id]),
    pool.query(`SELECT COUNT(*)::int AS count FROM "Comment" WHERE "authorId" = $1`, [user.id]),
  ]);

  let tabRows: Record<string, unknown>[] = [];
  if (activeTab === "ideas") {
    const { rows } = await pool.query(
      `SELECT i.id, i.title, COALESCE(i.description, i."shortDesc") AS description, i."createdAt",
              COUNT(v.id)::int AS "voteCount"
       FROM "Idea" i
       LEFT JOIN "Vote" v ON v."ideaId" = i.id
       WHERE i."userId" = $1
       GROUP BY i.id
       ORDER BY "voteCount" DESC, i."createdAt" DESC`,
      [user.id]
    );
    tabRows = rows;
  } else if (activeTab === "comments") {
    const { rows } = await pool.query(
      `SELECT c.id, c.body, c."createdAt", c."ideaId", c."postId",
              i.title AS "ideaTitle", p.title AS "postTitle"
       FROM "Comment" c
       LEFT JOIN "Idea" i ON i.id = c."ideaId"
       LEFT JOIN "CommunityPost" p ON p.id = c."postId"
       WHERE c."authorId" = $1
       ORDER BY c."createdAt" DESC`,
      [user.id]
    );
    tabRows = rows;
  } else {
    const { rows } = await pool.query(
      `SELECT i.id, i.title, COALESCE(i.description, i."shortDesc") AS description, v."createdAt" AS "votedAt"
       FROM "Vote" v
       JOIN "Idea" i ON i.id = v."ideaId"
       WHERE v."userId" = $1
       ORDER BY v."createdAt" DESC`,
      [user.id]
    );
    tabRows = rows;
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <ProfileHeaderClient
        isOwner={isOwner}
        initialName={user.name}
        initialBio={user.bio ?? ""}
        initialAvatar={user.avatar}
        username={user.username}
        joinDate={new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Ideas Submitted</p>
          <p className="mt-1 text-xl font-bold text-white">{ideasRes.rows[0]?.count ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Votes Cast</p>
          <p className="mt-1 text-xl font-bold text-white">{votesCastRes.rows[0]?.count ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Comments Made</p>
          <p className="mt-1 text-xl font-bold text-white">{commentsCountRes.rows[0]?.count ?? 0}</p>
        </div>
      </div>

      <div className="mt-6 flex rounded-xl border border-border bg-card p-1">
        {[
          { id: "ideas", label: "Ideas" },
          { id: "comments", label: "Comments" },
          { id: "voted", label: "Voted On" },
        ].map((t) => (
          <Link
            key={t.id}
            href={`/u/${user.username}?tab=${t.id}`}
            className={`rounded-lg px-3 py-2 text-sm transition-colors duration-200 ${
              activeTab === t.id ? "bg-white/10 text-white" : "text-muted hover:text-white"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <section className="mt-4 space-y-3">
        {tabRows.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-base font-semibold text-white">No activity yet</p>
            <p className="mt-1 text-sm text-muted">This tab is currently empty.</p>
          </div>
        ) : activeTab === "ideas" ? (
          tabRows.map((row) => (
            <Link key={row.id as string} href={`/ideas/${row.id as string}`} className="block rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold text-white">{row.title as string}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{row.description as string}</p>
              <p className="mt-2 text-xs text-muted">{Number(row.voteCount)} votes · {relTime(row.createdAt as string)}</p>
            </Link>
          ))
        ) : activeTab === "comments" ? (
          tabRows.map((row) => (
            <div key={row.id as string} className="rounded-xl border border-border bg-card p-4">
              <p className="line-clamp-3 text-sm text-muted">{row.body as string}</p>
              <p className="mt-2 text-xs text-muted">
                {row.ideaId ? (
                  <Link href={`/ideas/${row.ideaId as string}`} className="text-white hover:underline">
                    {(row.ideaTitle as string) || "View idea"}
                  </Link>
                ) : (
                  <Link href={`/community/${row.postId as string}`} className="text-white hover:underline">
                    {(row.postTitle as string) || "View post"}
                  </Link>
                )}{" "}
                · {relTime(row.createdAt as string)}
              </p>
            </div>
          ))
        ) : (
          tabRows.map((row) => (
            <Link key={row.id as string} href={`/ideas/${row.id as string}`} className="block rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold text-white">{row.title as string}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{row.description as string}</p>
              <p className="mt-2 text-xs text-muted">Voted {relTime(row.votedAt as string)}</p>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
