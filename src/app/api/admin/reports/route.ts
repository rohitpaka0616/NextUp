import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { rows } = await pool.query(
      `SELECT r.id, r."targetType", r."targetId", r.reason, r."createdAt",
              u.username AS "reporterUsername",
              i.title AS "ideaTitle",
              c.body AS "commentBody"
       FROM "Report" r
       JOIN "User" u ON u.id = r."reporterId"
       LEFT JOIN "Idea" i ON i.id = r."targetId" AND r."targetType" = 'idea'
       LEFT JOIN "Comment" c ON c.id = r."targetId" AND r."targetType" = 'comment'
       ORDER BY r."createdAt" DESC`
    );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
