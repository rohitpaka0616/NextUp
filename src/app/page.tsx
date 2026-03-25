import Link from "next/link";
import Image from "next/image";
import { pool } from "@/lib/db";
import IdeaCard from "@/components/IdeaCard";
import logo from "./logos/nu_logo.png";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { rows: ideas } = await pool.query(`
    SELECT i.id, i.title, i."shortDesc", i.status, i."createdAt",
           u.name AS "authorName",
           COUNT(v.id)::int AS "voteCount"
    FROM "Idea" i
    JOIN "User" u ON u.id = i."userId"
    LEFT JOIN "Vote" v ON v."ideaId" = i.id
    GROUP BY i.id, u.name
    ORDER BY "voteCount" DESC, i."createdAt" DESC
  `);

  return (
    <>
      {/* Hero */}
      <section className="mb-16 text-center">
        <div className="mb-6 flex items-center justify-center gap-4">
          <Image
            src={logo}
            alt="NextUp"
            width={100}
            height={56}
            priority
            className="logo-hero"
          />
          <div className="flex flex-col items-start">
            <span className="font-display text-5xl font-extrabold tracking-[-0.02em] text-foreground">
              NextUp
            </span>
            <span className="text-lg font-medium tracking-tight text-muted">
              Vote for what gets built{" "}
              <span className="bg-gradient-to-r from-accent to-indigo-400 bg-clip-text font-bold text-transparent">
                next.
              </span>
            </span>
          </div>
        </div>
        <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-muted">
          Pitch your software idea, rally votes, and the top idea becomes a real
          product.
        </p>

        <div className="mt-2 flex justify-center gap-3">
          <Link href="/submit" className="btn-primary">
            Submit Your Idea
          </Link>
          <a href="#ideas" className="btn-secondary">
            Browse Ideas
          </a>
        </div>
      </section>

      {/* Ideas list */}
      <section id="ideas">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            Top Ideas{" "}
            <span className="text-sm font-normal text-muted">
              ({ideas.length})
            </span>
          </h2>
        </div>

        {ideas.length === 0 ? (
          <div className="card-elevated py-16 text-center">
            <p className="text-lg text-muted">No ideas yet. Be the first!</p>
            <Link href="/submit" className="btn-primary mt-4 inline-flex">
              Submit an Idea
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {ideas.map((idea: Record<string, unknown>, i: number) => (
              <IdeaCard
                key={idea.id as string}
                id={idea.id as string}
                title={idea.title as string}
                shortDesc={idea.shortDesc as string}
                status={idea.status as "OPEN" | "BUILDING" | "SHIPPED"}
                authorName={idea.authorName as string}
                voteCount={idea.voteCount as number}
                rank={i + 1}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
