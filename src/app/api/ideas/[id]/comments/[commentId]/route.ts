import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id: ideaId, commentId } = await params;
    const payload = await req.json();
    const body = typeof payload.body === "string" ? payload.body.trim() : "";
    if (!body) return NextResponse.json({ error: "Comment body required" }, { status: 400 });

    const { rows: ownerRows } = await pool.query(
      `SELECT id FROM "Comment" WHERE id = $1 AND "ideaId" = $2 AND "authorId" = $3`,
      [commentId, ideaId, session.user.id]
    );
    if (ownerRows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { rows } = await pool.query(
      `UPDATE "Comment" SET body = $1 WHERE id = $2 RETURNING *`,
      [body, commentId]
    );
    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id: ideaId, commentId } = await params;

    const { rows: ownerRows } = await pool.query(
      `SELECT id FROM "Comment" WHERE id = $1 AND "ideaId" = $2 AND "authorId" = $3`,
      [commentId, ideaId, session.user.id]
    );
    if (ownerRows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await pool.query(`DELETE FROM "Comment" WHERE id = $1`, [commentId]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
