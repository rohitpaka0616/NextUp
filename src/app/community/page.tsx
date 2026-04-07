import Link from "next/link";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import CommunityPostForm from "@/components/CommunityPostForm";
import CommunityBoardClient from "@/components/CommunityBoardClient";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
    const session = await auth();

    let posts: Array<{
        id: string;
        title: string;
        body: string;
        tag: string;
        createdAt: Date;
        authorName: string;
        authorUsername: string;
        authorAvatar: string | null;
        commentCount: number;
    }> = [];
    let tableMissing = false;
    let totalMembers = 0;
    let totalIdeas = 0;
    let totalVotes = 0;
    let activeUsers: Array<{ id: string; username: string; avatar: string | null; score: number }> = [];

    try {
        const { rows } = await pool.query(
            `SELECT p.id, p.title, p.body, p.tag, p."createdAt",
                    u.name AS "authorName", COALESCE(u.username, '') AS "authorUsername", u.avatar AS "authorAvatar",
                    COUNT(c.id)::int AS "commentCount"
             FROM "CommunityPost" p
             JOIN "User" u ON u.id = p."authorId"
             LEFT JOIN "Comment" c ON c."postId" = p.id
             GROUP BY p.id, u.name, u.username, u.avatar
             ORDER BY COUNT(c.id) DESC, p."createdAt" DESC
             LIMIT 100`
        );
        posts = rows as typeof posts;

        const [membersRes, ideasRes, votesRes, activeRes] = await Promise.all([
            pool.query(`SELECT COUNT(*)::int AS count FROM "User"`),
            pool.query(`SELECT COUNT(*)::int AS count FROM "Idea"`),
            pool.query(`SELECT COUNT(*)::int AS count FROM "Vote"`),
            pool.query(
                `WITH comment_activity AS (
                   SELECT c."authorId" AS "userId", COUNT(*)::int AS cnt
                   FROM "Comment" c
                   WHERE c."createdAt" > NOW() - INTERVAL '7 days'
                   GROUP BY c."authorId"
                 ),
                 vote_activity AS (
                   SELECT v."userId", COUNT(*)::int AS cnt
                   FROM "Vote" v
                   WHERE v."createdAt" > NOW() - INTERVAL '7 days'
                   GROUP BY v."userId"
                 )
                 SELECT u.id, COALESCE(u.username, 'member') AS username, u.avatar,
                        (COALESCE(ca.cnt, 0) + COALESCE(va.cnt, 0))::int AS score
                 FROM "User" u
                 LEFT JOIN comment_activity ca ON ca."userId" = u.id
                 LEFT JOIN vote_activity va ON va."userId" = u.id
                 ORDER BY score DESC, u."createdAt" DESC
                 LIMIT 3`
            ),
        ]);
        totalMembers = membersRes.rows[0]?.count ?? 0;
        totalIdeas = ideasRes.rows[0]?.count ?? 0;
        totalVotes = votesRes.rows[0]?.count ?? 0;
        activeUsers = activeRes.rows as typeof activeUsers;
    } catch (e: unknown) {
        if (typeof e === "object" && e !== null && (e as { code?: string }).code === "42P01") {
            tableMissing = true;
        } else {
            throw e;
        }
    }

    return (
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
            <div className="mb-8">
                <Link href="/" className="text-sm font-medium text-muted hover:text-foreground">
                    ← Home
                </Link>
                <h1 className="mt-4 text-3xl font-bold">Community</h1>
                <p className="mt-2 text-muted">
                    Discuss improvements to NextUp and what we should build next.
                </p>
            </div>

            {tableMissing && (
                <div className="mb-8 rounded-xl border border-border bg-card-hover px-4 py-3 text-sm text-muted">
                    Discussion board is not active until you run{" "}
                    <code className="rounded bg-card px-1.5 py-0.5 text-xs">db/migrations/002_community_and_interest.sql</code>{" "}
                    on your Postgres database.
                </div>
            )}

            {session?.user && !tableMissing && <CommunityPostForm />}

            {!session?.user && !tableMissing && (
                <div className="card-elevated mb-8 p-6 text-center">
                    <p className="text-muted">Sign in to vote, comment or submit.</p>
                    <Link href="/auth/signin" className="btn-primary mt-4 inline-flex">
                        Sign in
                    </Link>
                </div>
            )}

            <section className="mt-10">
                <CommunityBoardClient
                    initialPosts={posts.map((p) => ({
                        ...p,
                        createdAt: new Date(p.createdAt).toISOString(),
                    }))}
                />
            </section>
            </div>

            <aside className="space-y-4 lg:col-span-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Stats</h3>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-center justify-between"><span className="text-muted">Members</span><span className="font-semibold text-white">{totalMembers}</span></li>
                        <li className="flex items-center justify-between"><span className="text-muted">Ideas</span><span className="font-semibold text-white">{totalIdeas}</span></li>
                        <li className="flex items-center justify-between"><span className="text-muted">Votes</span><span className="font-semibold text-white">{totalVotes}</span></li>
                    </ul>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Most Active This Week</h3>
                    {activeUsers.length === 0 ? (
                        <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted">
                            No activity yet this week.
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {activeUsers.map((u) => (
                                <li key={u.id} className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <Link href={`/u/${u.username}`}>
                                            {u.avatar ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={u.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                                            ) : (
                                                <span className="block h-6 w-6 rounded-full bg-white/10" />
                                            )}
                                        </Link>
                                        <Link href={`/u/${u.username}`} className="text-sm text-white hover:underline">
                                            @{u.username}
                                        </Link>
                                    </div>
                                    <span className="text-xs text-muted">{u.score}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </aside>
        </div>
    );
}
