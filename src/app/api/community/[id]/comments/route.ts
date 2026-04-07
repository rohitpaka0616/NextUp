import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { genId, pool } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params;
    const url = new URL(req.url);
    const sort = url.searchParams.get("sort") === "newest" ? "newest" : "top";
    const order = sort === "newest" ? `c."createdAt" DESC` : `c.upvotes DESC, c."createdAt" DESC`;

    const { rows } = await pool.query(
      `SELECT c.id, c.body, c."authorId", c."parentCommentId", c.upvotes, c."createdAt",
              u.name AS "authorName", COALESCE(u.username, '') AS "authorUsername", u.avatar AS "authorAvatar"
       FROM "Comment" c
       JOIN "User" u ON u.id = c."authorId"
       WHERE c."postId" = $1
       ORDER BY ${order}`,
      [postId]
    );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id: postId } = await params;
    const payload = await req.json();
    const body = typeof payload.body === "string" ? payload.body.trim() : "";
    const parentCommentId = typeof payload.parentCommentId === "string" ? payload.parentCommentId : null;
    if (!body) return NextResponse.json({ error: "Comment body required" }, { status: 400 });
    if (body.length > 1000) return NextResponse.json({ error: "Comment too long" }, { status: 400 });

    if (parentCommentId) {
      const { rows: parentRows } = await pool.query(
        `SELECT id, "parentCommentId" FROM "Comment" WHERE id = $1 AND "postId" = $2`,
        [parentCommentId, postId]
      );
      if (parentRows.length === 0) return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
      if (parentRows[0].parentCommentId) {
        return NextResponse.json({ error: "Only one reply level is supported" }, { status: 400 });
      }
    }

    const id = genId();
    const { rows } = await pool.query(
      `INSERT INTO "Comment" (id, body, "authorId", "postId", "parentCommentId", upvotes, "createdAt")
       VALUES ($1, $2, $3, $4, $5, 0, NOW())
       RETURNING *`,
      [id, body, session.user.id, postId, parentCommentId]
    );

    if (parentCommentId) {
      const { rows: parentRows } = await pool.query(
        `SELECT "authorId" FROM "Comment" WHERE id = $1 LIMIT 1`,
        [parentCommentId]
      );
      const parentAuthorId = parentRows[0]?.authorId as string | undefined;
      if (parentAuthorId && parentAuthorId !== session.user.id) {
        await pool.query(
          `INSERT INTO "Notification" (id, "userId", type, "referenceId", read, "createdAt")
           VALUES ($1, $2, 'COMMENT_REPLY', $3, false, NOW())`,
          [genId(), parentAuthorId, `/community/${postId}#comment-${parentCommentId}`]
        );
      }
    }
    return NextResponse.json(rows[0], { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
