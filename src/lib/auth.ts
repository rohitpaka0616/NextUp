import NextAuth from "next-auth";
import PostgresAdapter from "@auth/pg-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Email from "next-auth/providers/email";
import bcrypt from "bcryptjs";
import { genId, pool } from "@/lib/db";
import { normalizeEmail } from "@/lib/validation";
import { generateUniqueUsername } from "@/lib/usernames";

async function ensureUserProfile(email: string, fallbackName?: string | null, avatar?: string | null) {
    const emailNorm = normalizeEmail(email);
    const existing = await pool.query(
        `SELECT id, name, username, role, avatar FROM "User" WHERE email = $1 LIMIT 1`,
        [emailNorm]
    );

    if (existing.rows.length === 0) {
        const name = (fallbackName?.trim() || "New User").slice(0, 80);
        const username = await generateUniqueUsername(name);
        const { rows: countRows } = await pool.query(`SELECT COUNT(*)::int AS count FROM "User"`);
        const role = (countRows[0]?.count ?? 0) === 0 ? "admin" : "member";
        const id = genId();

        await pool.query(
            `INSERT INTO "User" (id, email, name, username, avatar, bio, role, "createdAt")
             VALUES ($1, $2, $3, $4, $5, '', $6, NOW())`,
            [id, emailNorm, name, username, avatar ?? null, role]
        );

        return { id, name, email: emailNorm, username, avatar: avatar ?? null, role };
    }

    const row = existing.rows[0];
    const nextName = row.name ?? fallbackName ?? "User";
    const nextAvatar = row.avatar ?? avatar ?? null;
    let nextUsername = row.username as string | null;
    if (!nextUsername) {
        nextUsername = await generateUniqueUsername(nextName);
    }
    const nextRole = (row.role as string | null) ?? "member";

    await pool.query(
        `UPDATE "User"
         SET name = COALESCE($2, name),
             username = COALESCE(username, $3),
             avatar = COALESCE(avatar, $4),
             role = COALESCE(role, $5)
         WHERE id = $1`,
        [row.id, nextName, nextUsername, nextAvatar, nextRole]
    );

    return {
        id: row.id as string,
        name: nextName,
        email: emailNorm,
        username: nextUsername,
        avatar: nextAvatar,
        role: nextRole,
    };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    // Required for Vercel + custom domains: URLs are derived from request Host / x-forwarded-* headers.
    trustHost: true,
    session: { strategy: "jwt" },
    adapter: PostgresAdapter(pool),
    pages: {
        signIn: "/auth/signin",
    },
    providers: [
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? [
                  Google({
                      clientId: process.env.GOOGLE_CLIENT_ID,
                      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                  }),
              ]
            : []),
        ...(process.env.EMAIL_SERVER && process.env.EMAIL_FROM
            ? [
                  Email({
                      server: process.env.EMAIL_SERVER,
                      from: process.env.EMAIL_FROM,
                  }),
              ]
            : []),
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const email = normalizeEmail(credentials.email as string);

                const { rows } = await pool.query(
                    `SELECT id, name, email, username, avatar, role, "passwordHash" FROM "User" WHERE email = $1`,
                    [email]
                );
                const user = rows[0];
                if (!user || !user.passwordHash) return null;

                const valid = await bcrypt.compare(
                    credentials.password as string,
                    user.passwordHash
                );
                if (!valid) return null;

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    username: user.username,
                    image: user.avatar,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async signIn({ user }) {
            if (!user.email) return false;
            await ensureUserProfile(user.email, user.name, user.image);
            return true;
        },
        async jwt({ token, user }) {
            const email = user?.email ?? token.email;
            if (email) {
                const profile = await ensureUserProfile(email, user?.name, user?.image);
                token.id = profile.id;
                token.name = profile.name;
                token.email = profile.email;
                token.username = profile.username;
                token.picture = profile.avatar ?? undefined;
                token.role = profile.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.name = (token.name as string) ?? session.user.name;
                session.user.email = (token.email as string) ?? session.user.email;
                session.user.username = token.username as string;
                session.user.avatar = (token.picture as string | undefined) ?? null;
                session.user.role = token.role as "admin" | "member";
            }
            return session;
        },
    },
});
