import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",
    },
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const { rows } = await pool.query(
                    `SELECT id, name, email, "passwordHash" FROM "User" WHERE email = $1`,
                    [credentials.email]
                );
                const user = rows[0];
                if (!user) return null;

                const valid = await bcrypt.compare(
                    credentials.password as string,
                    user.passwordHash
                );
                if (!valid) return null;

                return { id: user.id, name: user.name, email: user.email };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
});
