import { Pool } from "pg";

const globalForPg = globalThis as unknown as { pool: Pool | undefined };

export const pool =
    globalForPg.pool ??
    new Pool({ connectionString: process.env.DATABASE_URL?.replace(/\?schema=\w+$/, "") });

if (process.env.NODE_ENV !== "production") globalForPg.pool = pool;

// ── Domain types ────────────────────────────────────────

export type Status = "OPEN" | "BUILDING" | "SHIPPED";

export interface User {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
}

export interface Idea {
    id: string;
    title: string;
    shortDesc: string;
    longDesc: string;
    status: Status;
    createdAt: Date;
    userId: string;
}

export interface Vote {
    id: string;
    userId: string;
    ideaId: string;
    createdAt: Date;
}

// ── Helpers ─────────────────────────────────────────────

/** Generate a cuid-like random id */
export function genId(): string {
    return crypto.randomUUID();
}
