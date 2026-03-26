import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pool, genId } from "@/lib/db";

// GET /api/ideas — list ideas ranked by vote count
export async function GET() {
    try {
        const { rows } = await pool.query(`
            SELECT i.*, u.id AS "userId", u.name AS "authorName",
                   COUNT(v.id)::int AS "voteCount"
            FROM "Idea" i
            JOIN "User" u ON u.id = i."userId"
            LEFT JOIN "Vote" v ON v."ideaId" = i.id
            GROUP BY i.id, u.id, u.name
            ORDER BY "voteCount" DESC, i."createdAt" DESC
        `);

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

        const { title, shortDesc, longDesc } = await req.json();

        if (!title || !shortDesc || !longDesc) {
            return NextResponse.json(
                { error: "Title, short description, and long description are required" },
                { status: 400 }
            );
        }

        const id = genId();
        const { rows } = await pool.query(
            `INSERT INTO "Idea" (id, title, "shortDesc", "longDesc", status, "createdAt", "userId")
             VALUES ($1, $2, $3, $4, 'OPEN', NOW(), $5)
             RETURNING *`,
            [id, title, shortDesc, longDesc, session.user.id]
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
