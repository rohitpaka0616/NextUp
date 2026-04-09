import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { BIO_MAX_CHARS } from "@/lib/profileLimits";

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();
    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    const bio = typeof payload.bio === "string" ? payload.bio.trim() : "";
    const avatar = typeof payload.avatar === "string" ? payload.avatar.trim() : "";

    if (!name || name.length < 2 || name.length > 80) {
      return NextResponse.json({ error: "Name must be 2-80 characters." }, { status: 400 });
    }
    if (bio.length > BIO_MAX_CHARS) {
      return NextResponse.json(
        { error: `Bio must be ${BIO_MAX_CHARS} characters max.` },
        { status: 400 }
      );
    }
    if (avatar.length > 0 && avatar.length > 2000000) {
      return NextResponse.json({ error: "Avatar is too large." }, { status: 400 });
    }

    const { rows } = await pool.query(
      `UPDATE "User"
       SET name = $1, bio = $2, avatar = NULLIF($3, '')
       WHERE id = $4
       RETURNING id, name, username, avatar, bio, "createdAt"`,
      [name, bio, avatar, session.user.id]
    );

    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
