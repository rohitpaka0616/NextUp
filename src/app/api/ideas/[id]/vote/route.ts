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
            `SELECT id, "userId", vote_count FROM "Idea" WHERE id = $1`,
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
            await pool.query(`UPDATE "Idea" SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = $1`, [ideaId]);
            return NextResponse.json({ voted: false });
        }

        const id = genId();
        await pool.query(
            `INSERT INTO "Vote" (id, "userId", "ideaId", "createdAt")
             VALUES ($1, $2, $3, NOW())`,
            [id, session.user.id, ideaId]
        );
        const { rows: updatedRows } = await pool.query(
            `UPDATE "Idea" SET vote_count = vote_count + 1 WHERE id = $1 RETURNING vote_count, "userId"`,
            [ideaId]
        );
        const voteCount = updatedRows[0]?.vote_count as number | undefined;
        const ownerId = updatedRows[0]?.userId as string | undefined;
        const milestones = new Set([10, 25, 50, 100]);
        if (
            ownerId &&
            ownerId !== session.user.id &&
            typeof voteCount === "number" &&
            milestones.has(voteCount)
        ) {
            const referenceId = `/ideas/${ideaId}`;
            const { rows: existsRows } = await pool.query(
                `SELECT id FROM "Notification" WHERE "userId" = $1 AND type = 'IDEA_VOTE_MILESTONE' AND "referenceId" = $2 LIMIT 1`,
                [ownerId, `${referenceId}?m=${voteCount}`]
            );
            if (existsRows.length === 0) {
                await pool.query(
                    `INSERT INTO "Notification" (id, "userId", type, "referenceId", read, "createdAt")
                     VALUES ($1, $2, 'IDEA_VOTE_MILESTONE', $3, false, NOW())`,
                    [genId(), ownerId, `${referenceId}?m=${voteCount}`]
                );
            }
        }

        return NextResponse.json({ voted: true });
    } catch {
        return NextResponse.json(
            { error: "Failed to toggle vote" },
            { status: 500 }
        );
    }
}
