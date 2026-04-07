import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/auth/signin");
    const { rows } = await pool.query(`SELECT username FROM "User" WHERE id = $1`, [session.user.id]);
    const username = rows[0]?.username;
    if (!username) redirect("/auth/signin");
    redirect(`/u/${username}`);
}
