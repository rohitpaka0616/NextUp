import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pool, genId } from "@/lib/db";
import { COMMUNITY_POST_MAX } from "@/lib/limits";

function isUndefinedTable(error: unknown): boolean {
    return typeof error === "object" && error !== null && (error as { code?: string }).code === "42P01";
}

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const sort = url.searchParams.get("sort");
        const orderBy =
            sort === "new"
                ? `p."createdAt" DESC`
                : sort === "hot"
                  ? `COUNT(rc.id) DESC, p."createdAt" DESC`
                  : `COUNT(c.id) DESC, p."createdAt" DESC`;
        const { rows } = await pool.query(
            `SELECT p.id, p.title, p.body, p.tag, p.upvotes, p."createdAt",
                    u.name AS "authorName", u.id AS "authorId", u.avatar AS "authorAvatar",
                    COALESCE(u.username, '') AS "authorUsername",
                    COUNT(c.id)::int AS "commentCount"
             FROM "CommunityPost" p
             JOIN "User" u ON u.id = p."authorId"
             LEFT JOIN "Comment" c ON c."postId" = p.id
             LEFT JOIN "Comment" rc ON rc."postId" = p.id AND rc."createdAt" > NOW() - INTERVAL '7 days'
             GROUP BY p.id, u.name, u.id, u.avatar, u.username
             ORDER BY ${orderBy}
             LIMIT 80`
        );
        return NextResponse.json(rows);
    } catch (error: unknown) {
        if (isUndefinedTable(error)) {
            return NextResponse.json(
                { error: "Community is not set up yet. Apply db/migrations/002_community_and_interest.sql to your database." },
                { status: 503 }
            );
        }
        console.error("GET /api/community", error);
        return NextResponse.json({ error: "Failed to load community posts" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await req.json();
        const title = typeof payload.title === "string" ? payload.title.trim() : "";
        const body = typeof payload.body === "string" ? payload.body.trim() : "";
        const tag = typeof payload.tag === "string" ? payload.tag.trim() : "General";
        if (!title || !body) {
            return NextResponse.json({ error: "Title and body are required" }, { status: 400 });
        }
        if (title.length > 120 || body.length > COMMUNITY_POST_MAX) {
            return NextResponse.json(
                { error: `Title/body too long` },
                { status: 400 }
            );
        }

        const id = genId();
        const { rows: inserted } = await pool.query(
            `INSERT INTO "CommunityPost" (id, title, body, tag, "authorId", "createdAt")
             VALUES ($1, $2, $3, $4, $5, NOW())
             RETURNING id, title, body, tag, "createdAt"`,
            [id, title, body, tag, session.user.id]
        );

        const { rows: userRows } = await pool.query(`SELECT name, username, avatar FROM "User" WHERE id = $1`, [
            session.user.id,
        ]);

        return NextResponse.json({
            ...inserted[0],
            authorName: userRows[0]?.name ?? "Member",
            authorUsername: userRows[0]?.username ?? "",
            authorAvatar: userRows[0]?.avatar ?? null,
            authorId: session.user.id,
            commentCount: 0,
        });
    } catch (error: unknown) {
        if (isUndefinedTable(error)) {
            return NextResponse.json(
                { error: "Community is not set up yet. Apply db/migrations/002_community_and_interest.sql." },
                { status: 503 }
            );
        }
        console.error("POST /api/community", error);
        return NextResponse.json({ error: "Failed to post" }, { status: 500 });
    }
}
