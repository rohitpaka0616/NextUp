import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool, genId } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: "Name, email, and password are required" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        const { rows: existing } = await pool.query(
            `SELECT id FROM "User" WHERE email = $1`,
            [email]
        );
        if (existing.length > 0) {
            return NextResponse.json(
                { error: "Email already registered" },
                { status: 409 }
            );
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const id = genId();

        const { rows } = await pool.query(
            `INSERT INTO "User" (id, name, email, "passwordHash", "createdAt")
             VALUES ($1, $2, $3, $4, NOW())
             RETURNING id, name, email, "createdAt"`,
            [id, name, email, passwordHash]
        );

        return NextResponse.json(rows[0], { status: 201 });
    } catch {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
