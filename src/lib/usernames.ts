import { pool } from "@/lib/db";

function slugFromName(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "")
    .trim();
  return base || "user";
}

export async function generateUniqueUsername(name: string): Promise<string> {
  const root = slugFromName(name).slice(0, 20);
  let candidate = root;
  let suffix = 1;

  while (true) {
    const { rows } = await pool.query(`SELECT 1 FROM "User" WHERE username = $1 LIMIT 1`, [candidate]);
    if (rows.length === 0) return candidate;
    suffix += 1;
    candidate = `${root}${suffix}`.slice(0, 28);
  }
}
