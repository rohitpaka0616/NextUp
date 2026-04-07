import { pool } from "@/lib/db";

export interface IdeaInterestSnapshot {
    count: number;
    sampleNames: string[];
    viewerInterested: boolean;
    setupRequired: boolean;
}

export async function getIdeaInterestSnapshot(
    ideaId: string,
    userId: string | undefined
): Promise<IdeaInterestSnapshot> {
    try {
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
        if (userId) {
            const { rows: mine } = await pool.query(
                `SELECT 1 FROM "IdeaInterest" WHERE "ideaId" = $1 AND "userId" = $2`,
                [ideaId, userId]
            );
            viewerInterested = mine.length > 0;
        }

        return {
            count,
            sampleNames: sample.map((r: { name: string }) => r.name),
            viewerInterested,
            setupRequired: false,
        };
    } catch (e: unknown) {
        if (typeof e === "object" && e !== null && (e as { code?: string }).code === "42P01") {
            return {
                count: 0,
                sampleNames: [],
                viewerInterested: false,
                setupRequired: true,
            };
        }
        throw e;
    }
}
