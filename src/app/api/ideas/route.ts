import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pool, genId } from "@/lib/db";
import { trimIdeaFields, validateIdeaContent } from "@/lib/validation";

// GET /api/ideas — list ideas ranked by vote count
export async function GET(req: Request) {
    try {
        const session = await auth();
        const url = new URL(req.url);
        const sort = url.searchParams.get("sort");
        const orderBy =
            sort === "new"
                ? `i."createdAt" DESC`
                : sort === "trending"
                  ? `COUNT(tv.id) DESC, i."createdAt" DESC`
                  : `COUNT(v.id) DESC, i."createdAt" DESC`;

        const { rows } = await pool.query(
            `SELECT i.id,
                    i.title,
                    COALESCE(i.description, i."longDesc") AS description,
                    COALESCE(i.category, 'Other') AS category,
                    i."externalLink",
                    i."createdAt",
                    u.name AS "authorName",
                    COALESCE(u.username, '') AS "authorUsername",
                    u.avatar AS "authorAvatar",
                    COUNT(DISTINCT c.id)::int AS "commentCount",
                    COUNT(v.id)::int AS "voteCount",
                    BOOL_OR(v."userId" = $1) AS "votedByMe"
             FROM "Idea" i
             JOIN "User" u ON u.id = i."userId"
             LEFT JOIN "Vote" v ON v."ideaId" = i.id
             LEFT JOIN "Vote" tv ON tv."ideaId" = i.id AND tv."createdAt" > NOW() - INTERVAL '7 days'
             LEFT JOIN "Comment" c ON c."ideaId" = i.id
             GROUP BY i.id, u.name, u.username, u.avatar
             ORDER BY ${orderBy}`,
            [session?.user?.id ?? ""]
        );

        return NextResponse.json(rows);
    } catch {
        return NextResponse.json(
            { error: "Failed to fetch ideas" },
            { status: 500 }
        );
    }
}

// POST /api/ideas — create a new idea (auth required)
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // If DB changed (e.g. moved to Neon), an old JWT can reference a user id
        // that does not exist in the current database.
        const { rows: userRows } = await pool.query(
            `SELECT id FROM "User" WHERE id = $1`,
            [session.user.id]
        );
        if (userRows.length === 0) {
            return NextResponse.json(
                { error: "Your session is out of sync with the database. Please sign out and sign in again." },
                { status: 401 }
            );
        }

        const body = await req.json();
        const fields = trimIdeaFields(body);
        if (!fields) {
            return NextResponse.json(
                { error: "Invalid JSON: title, shortDesc, and longDesc must be strings" },
                { status: 400 }
            );
        }

        const invalid = validateIdeaContent(fields);
        if (invalid) {
            return NextResponse.json({ error: invalid }, { status: 400 });
        }

        const category =
            typeof body.category === "string" && body.category.trim().length > 0
                ? body.category.trim().slice(0, 24)
                : "Other";
        const externalLink =
            typeof body.externalLink === "string" && body.externalLink.trim().length > 0
                ? body.externalLink.trim().slice(0, 500)
                : null;

        const id = genId();
        const { rows } = await pool.query(
            `INSERT INTO "Idea" (
                id, title, description, category, "externalLink", "shortDesc", "longDesc",
                status, "createdAt", "userId", vote_count
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'OPEN', NOW(), $8, 0)
             RETURNING *`,
            [
                id,
                fields.title.slice(0, 80),
                fields.longDesc.slice(0, 1000),
                category,
                externalLink,
                fields.shortDesc,
                fields.longDesc,
                session.user.id,
            ]
        );

        return NextResponse.json(rows[0], { status: 201 });
    } catch (error: unknown) {
        const pgError = error as { code?: string; message?: string };
        console.error("POST /api/ideas failed:", pgError);

        if (pgError.code === "23503") {
            return NextResponse.json(
                { error: "Invalid user reference. Please sign out and sign in again." },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                error:
                    process.env.NODE_ENV === "development"
                        ? `Failed to create idea: ${pgError.message ?? "Unknown error"}`
                        : "Failed to create idea",
            },
            { status: 500 }
        );
    }
}
