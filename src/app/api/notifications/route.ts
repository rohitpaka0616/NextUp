import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([], { status: 200 });
    const { rows } = await pool.query(
      `SELECT id, type, "referenceId", read, "createdAt"
       FROM "Notification"
       WHERE "userId" = $1
       ORDER BY "createdAt" DESC
       LIMIT 30`,
      [session.user.id]
    );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await pool.query(`UPDATE "Notification" SET read = true WHERE "userId" = $1`, [session.user.id]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to mark notifications read" }, { status: 500 });
  }
}
