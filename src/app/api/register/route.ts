import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool, genId } from "@/lib/db";
import { generateUniqueUsername } from "@/lib/usernames";
import {
    isValidDisplayName,
    isValidEmail,
    normalizeEmail,
} from "@/lib/validation";

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return NextResponse.json(
                { error: "Name, email, and password are required" },
                { status: 400 }
            );
        }

        if (!isValidDisplayName(name)) {
            return NextResponse.json(
                {
                    error:
                        "Please enter a display name (2–80 characters, including at least one letter).",
                },
                { status: 400 }
            );
        }

        if (!isValidEmail(email)) {
            return NextResponse.json(
                { error: "Please enter a valid email address." },
                { status: 400 }
            );
        }

        const emailNorm = normalizeEmail(email);

        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        const { rows: existing } = await pool.query(
            `SELECT id FROM "User" WHERE email = $1`,
            [emailNorm]
        );
        if (existing.length > 0) {
            return NextResponse.json(
                { error: "Email already registered" },
                { status: 409 }
            );
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const id = genId();
        const displayName = name.trim();
        const username = await generateUniqueUsername(displayName);
        const { rows: countRows } = await pool.query(`SELECT COUNT(*)::int AS count FROM "User"`);
        const role = (countRows[0]?.count ?? 0) === 0 ? "admin" : "member";

        const { rows } = await pool.query(
            `INSERT INTO "User" (id, name, email, username, avatar, bio, role, "passwordHash", "createdAt")
             VALUES ($1, $2, $3, $4, NULL, '', $5, $6, NOW())
             RETURNING id, name, email, username, avatar, bio, role, "createdAt"`,
            [id, displayName, emailNorm, username, role, passwordHash]
        );

        return NextResponse.json(rows[0], { status: 201 });
    } catch {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
