import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { redirect } from "next/navigation";
import ReportsAdminClient from "@/components/ReportsAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") redirect("/");

  const { rows } = await pool.query(
    `SELECT r.id, r."targetType", r."targetId", r.reason, r."createdAt",
            u.username AS "reporterUsername",
            i.title AS "ideaTitle",
            c.body AS "commentBody"
     FROM "Report" r
     JOIN "User" u ON u.id = r."reporterId"
     LEFT JOIN "Idea" i ON i.id = r."targetId" AND r."targetType" = 'idea'
     LEFT JOIN "Comment" c ON c.id = r."targetId" AND r."targetType" = 'comment'
     ORDER BY r."createdAt" DESC`
  );

  return (
    <main className="mx-auto w-full max-w-5xl">
      <h1 className="mb-4 text-3xl font-bold text-white">Moderation Reports</h1>
      <ReportsAdminClient
        initialReports={rows.map((r) => ({
          ...r,
          createdAt: new Date(r.createdAt as Date).toISOString(),
        }))}
      />
    </main>
  );
}
