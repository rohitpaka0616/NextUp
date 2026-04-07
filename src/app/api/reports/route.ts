import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { genId, pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await req.json();
    const targetType = payload.targetType as string;
    const targetId = payload.targetId as string;
    const reason = payload.reason as string;
    if (!["idea", "comment"].includes(targetType) || !targetId || !reason) {
      return NextResponse.json({ error: "Invalid report payload" }, { status: 400 });
    }

    const id = genId();
    await pool.query(
      `INSERT INTO "Report" (id, "reporterId", "targetType", "targetId", reason, "createdAt")
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [id, session.user.id, targetType, targetId, reason]
    );
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
  }
}
