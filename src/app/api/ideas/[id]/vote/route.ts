import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pool, genId } from "@/lib/db";

// POST /api/ideas/[id]/vote — toggle vote (auth required)
export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: ideaId } = await params;

        // Check idea exists
        const { rows: ideaRows } = await pool.query(
            `SELECT id FROM "Idea" WHERE id = $1`,
            [ideaId]
        );
        if (ideaRows.length === 0) {
            return NextResponse.json({ error: "Idea not found" }, { status: 404 });
        }

        // Toggle: if already voted, remove; otherwise, create
        const { rows: voteRows } = await pool.query(
            `SELECT id FROM "Vote" WHERE "userId" = $1 AND "ideaId" = $2`,
            [session.user.id, ideaId]
        );

        if (voteRows.length > 0) {
            await pool.query(`DELETE FROM "Vote" WHERE id = $1`, [voteRows[0].id]);
            return NextResponse.json({ voted: false });
        }

        const id = genId();
        await pool.query(
            `INSERT INTO "Vote" (id, "userId", "ideaId", "createdAt")
             VALUES ($1, $2, $3, NOW())`,
            [id, session.user.id, ideaId]
        );

        return NextResponse.json({ voted: true });
    } catch {
        return NextResponse.json(
            { error: "Failed to toggle vote" },
            { status: 500 }
        );
    }
}
