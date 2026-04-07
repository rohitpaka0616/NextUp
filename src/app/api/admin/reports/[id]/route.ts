import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const payload = await req.json();
    const action = payload.action as string;

    const { rows: reportRows } = await pool.query(
      `SELECT id, "targetType", "targetId" FROM "Report" WHERE id = $1`,
      [id]
    );
    if (reportRows.length === 0) return NextResponse.json({ error: "Report not found" }, { status: 404 });
    const report = reportRows[0];

    if (action === "delete") {
      if (report.targetType === "idea") {
        await pool.query(`DELETE FROM "Idea" WHERE id = $1`, [report.targetId]);
      } else if (report.targetType === "comment") {
        await pool.query(`DELETE FROM "Comment" WHERE id = $1`, [report.targetId]);
      }
    }

    await pool.query(`DELETE FROM "Report" WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to process report" }, { status: 500 });
  }
}
