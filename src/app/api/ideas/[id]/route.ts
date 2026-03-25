import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/ideas/[id] — single idea detail
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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

        if (rows.length === 0) {
            return NextResponse.json({ error: "Idea not found" }, { status: 404 });
        }

        return NextResponse.json(rows[0]);
    } catch {
        return NextResponse.json(
            { error: "Failed to fetch idea" },
            { status: 500 }
        );
    }
}

// PATCH /api/ideas/[id] — update idea status (author only)
const VALID_STATUSES = ["OPEN", "BUILDING", "SHIPPED"] as const;

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { status } = await req.json();

        if (!VALID_STATUSES.includes(status)) {
            return NextResponse.json(
                { error: "Invalid status. Must be OPEN, BUILDING, or SHIPPED." },
                { status: 400 }
            );
        }

        // Verify admin
        if (session.user.email !== process.env.ADMIN_EMAIL) {
            return NextResponse.json({ error: "Only the admin can change the status" }, { status: 403 });
        }

        const { rows: ideaRows } = await pool.query(
            `SELECT id FROM "Idea" WHERE id = $1`,
            [id]
        );

        if (ideaRows.length === 0) {
            return NextResponse.json({ error: "Idea not found" }, { status: 404 });
        }

        const { rows } = await pool.query(
            `UPDATE "Idea" SET status = $1 WHERE id = $2 RETURNING *`,
            [status, id]
        );

        return NextResponse.json(rows[0]);
    } catch {
        return NextResponse.json(
            { error: "Failed to update status" },
            { status: 500 }
        );
    }
}
