import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pool, genId } from "@/lib/db";
import { IDEA_INTEREST_NOTE_MAX } from "@/lib/limits";

function isUndefinedTable(error: unknown): boolean {
    return typeof error === "object" && error !== null && (error as { code?: string }).code === "42P01";
}

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: ideaId } = await params;

        const { rows: countRows } = await pool.query(
            `SELECT COUNT(*)::int AS c FROM "IdeaInterest" WHERE "ideaId" = $1`,
            [ideaId]
        );
        const count = countRows[0]?.c ?? 0;

        const { rows: sample } = await pool.query(
            `SELECT u.name
             FROM "IdeaInterest" i
             JOIN "User" u ON u.id = i."userId"
             WHERE i."ideaId" = $1
             ORDER BY i."createdAt" ASC
             LIMIT 12`,
            [ideaId]
        );

        let viewerInterested = false;
        const session = await auth();
        if (session?.user?.id) {
            const { rows: mine } = await pool.query(
                `SELECT 1 FROM "IdeaInterest" WHERE "ideaId" = $1 AND "userId" = $2`,
                [ideaId, session.user.id]
            );
            viewerInterested = mine.length > 0;
        }

        return NextResponse.json({
            count,
            sampleNames: sample.map((r: { name: string }) => r.name),
            viewerInterested,
        });
    } catch (error: unknown) {
        if (isUndefinedTable(error)) {
            return NextResponse.json(
                {
                    count: 0,
                    sampleNames: [],
                    viewerInterested: false,
                    setupRequired: true,
                },
                { status: 200 }
            );
        }
        console.error("GET interest", error);
        return NextResponse.json({ error: "Failed to load interest" }, { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: ideaId } = await params;
        const raw = await req.json();
        const note =
            typeof raw?.note === "string" ? raw.note.trim().slice(0, IDEA_INTEREST_NOTE_MAX) : "";

        const { rows: ideaOk } = await pool.query(`SELECT id FROM "Idea" WHERE id = $1`, [ideaId]);
        if (ideaOk.length === 0) {
            return NextResponse.json({ error: "Idea not found" }, { status: 404 });
        }

        const id = genId();
        await pool.query(
            `INSERT INTO "IdeaInterest" (id, "userId", "ideaId", note, "createdAt")
             VALUES ($1, $2, $3, $4, NOW())
             ON CONFLICT ON CONSTRAINT "IdeaInterest_userId_ideaId_key"
             DO UPDATE SET note = EXCLUDED.note`,
            [id, session.user.id, ideaId, note || null]
        );

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        if (isUndefinedTable(error)) {
            return NextResponse.json(
                { error: "Feature not set up. Apply db/migrations/002_community_and_interest.sql." },
                { status: 503 }
            );
        }
        console.error("POST interest", error);
        return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: ideaId } = await params;
        await pool.query(`DELETE FROM "IdeaInterest" WHERE "ideaId" = $1 AND "userId" = $2`, [
            ideaId,
            session.user.id,
        ]);

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        if (isUndefinedTable(error)) {
            return NextResponse.json(
                { error: "Feature not set up. Apply db/migrations/002_community_and_interest.sql." },
                { status: 503 }
            );
        }
        console.error("DELETE interest", error);
        return NextResponse.json({ error: "Failed to remove" }, { status: 500 });
    }
}
