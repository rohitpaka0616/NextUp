import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { auth } from "@/lib/auth";
import { moderateIdeaFields } from "@/lib/localmod";
import { trimIdeaFields, validateIdeaContent } from "@/lib/validation";
import { createOrgRepoForIdea } from "@/lib/github";

function isMissingColumnError(error: unknown) {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "42703"
    );
}

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

async function provisionRepoIfNeeded(idea: {
    id: string;
    title: string;
    shortDesc: string;
    status: "OPEN" | "BUILDING" | "SHIPPED";
    repoUrl: string | null;
}) {
    if (idea.repoUrl) return null;
    if (idea.status !== "BUILDING" && idea.status !== "SHIPPED") return null;

    const repo = await createOrgRepoForIdea({
        ideaId: idea.id,
        ideaTitle: idea.title,
        ideaDescription: idea.shortDesc ?? "",
    });
    if (!repo) return null;

    const { rows } = await pool.query(
        `UPDATE "Idea"
         SET "repoName" = $1, "repoUrl" = $2, "repoCreatedAt" = NOW()
         WHERE id = $3
         RETURNING *`,
        [repo.name, repo.htmlUrl, idea.id]
    );

    return rows[0];
}

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

        let ideaRows: Array<{
            id: string;
            title: string;
            shortDesc: string;
            status: "OPEN" | "BUILDING" | "SHIPPED";
            repoUrl: string | null;
        }> = [];
        try {
            const result = await pool.query(
                `SELECT id, title, "shortDesc", status, "repoUrl"
                 FROM "Idea"
                 WHERE id = $1`,
                [id]
            );
            ideaRows = result.rows;
        } catch (error) {
            if (!isMissingColumnError(error)) throw error;
            const fallback = await pool.query(
                `SELECT id, title, "shortDesc", status, NULL::text AS "repoUrl"
                 FROM "Idea"
                 WHERE id = $1`,
                [id]
            );
            ideaRows = fallback.rows;
        }

        if (ideaRows.length === 0) {
            return NextResponse.json({ error: "Idea not found" }, { status: 404 });
        }

        const { rows } = await pool.query(
            `UPDATE "Idea" SET status = $1 WHERE id = $2 RETURNING *`,
            [status, id]
        );

        const updatedIdea = rows[0] as {
            id: string;
            title: string;
            shortDesc: string;
            status: "OPEN" | "BUILDING" | "SHIPPED";
            repoUrl: string | null;
        };

        try {
            const withRepo = await provisionRepoIfNeeded(updatedIdea);
            return NextResponse.json(withRepo ?? updatedIdea);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Repo provisioning failed";
            return NextResponse.json(
                {
                    ...updatedIdea,
                    repoProvisionWarning: message,
                },
                { status: 200 }
            );
        }
    } catch {
        return NextResponse.json(
            { error: "Failed to update status" },
            { status: 500 }
        );
    }
}

// POST /api/ideas/[id] — manually provision GitHub repository (admin only)
export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (session.user.email !== process.env.ADMIN_EMAIL) {
            return NextResponse.json({ error: "Only the admin can provision repos" }, { status: 403 });
        }

        const { id } = await params;
        let rows: Array<{
            id: string;
            title: string;
            shortDesc: string;
            status: "OPEN" | "BUILDING" | "SHIPPED";
            repoUrl: string | null;
            repoName: string | null;
        }> = [];
        try {
            const result = await pool.query(
                `SELECT id, title, "shortDesc", status, "repoUrl", "repoName"
                 FROM "Idea"
                 WHERE id = $1`,
                [id]
            );
            rows = result.rows;
        } catch (error) {
            if (!isMissingColumnError(error)) throw error;
            const fallback = await pool.query(
                `SELECT id, title, "shortDesc", status, NULL::text AS "repoUrl", NULL::text AS "repoName"
                 FROM "Idea"
                 WHERE id = $1`,
                [id]
            );
            rows = fallback.rows;
        }
        if (rows.length === 0) {
            return NextResponse.json({ error: "Idea not found" }, { status: 404 });
        }

        const idea = rows[0] as {
            id: string;
            title: string;
            shortDesc: string;
            status: "OPEN" | "BUILDING" | "SHIPPED";
            repoUrl: string | null;
            repoName: string | null;
        };

        if (idea.repoUrl) {
            return NextResponse.json(idea);
        }

        const withRepo = await provisionRepoIfNeeded(idea);
        if (!withRepo) {
            return NextResponse.json(
                { error: "Set idea status to BUILDING or SHIPPED before creating a repo." },
                { status: 400 }
            );
        }
        return NextResponse.json(withRepo);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to provision repository" },
            { status: 500 }
        );
    }
}

// PUT /api/ideas/[id] — edit an idea (owner only)
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
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

        const moderation = await moderateIdeaFields(fields);
        if (!moderation.ok) {
            return NextResponse.json({ error: moderation.error }, { status: moderation.status });
        }

        const { rows: ideaRows } = await pool.query(
            `SELECT id, "userId" FROM "Idea" WHERE id = $1`,
            [id]
        );

        if (ideaRows.length === 0) {
            return NextResponse.json({ error: "Idea not found" }, { status: 404 });
        }

        if (ideaRows[0].userId !== session.user.id) {
            return NextResponse.json(
                { error: "You can only edit your own submissions" },
                { status: 403 }
            );
        }

        const { rows } = await pool.query(
            `UPDATE "Idea"
             SET title = $1, "shortDesc" = $2, "longDesc" = $3
             WHERE id = $4
             RETURNING *`,
            [fields.title, fields.shortDesc, fields.longDesc, id]
        );

        return NextResponse.json(rows[0]);
    } catch {
        return NextResponse.json(
            { error: "Failed to update idea" },
            { status: 500 }
        );
    }
}

// DELETE /api/ideas/[id] — delete an idea (owner only)
export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { rows: ideaRows } = await pool.query(
            `SELECT id, "userId" FROM "Idea" WHERE id = $1`,
            [id]
        );

        if (ideaRows.length === 0) {
            return NextResponse.json({ error: "Idea not found" }, { status: 404 });
        }

        if (ideaRows[0].userId !== session.user.id) {
            return NextResponse.json(
                { error: "You can only delete your own submissions" },
                { status: 403 }
            );
        }

        await pool.query(`DELETE FROM "Idea" WHERE id = $1`, [id]);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json(
            { error: "Failed to delete idea" },
            { status: 500 }
        );
    }
}
