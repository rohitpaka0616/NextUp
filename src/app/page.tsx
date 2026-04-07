import Link from "next/link";
import { pool } from "@/lib/db";
import { auth } from "@/lib/auth";
import StatusBadge from "@/components/StatusBadge";
import DeleteIdeaButton from "@/components/DeleteIdeaButton";
import SubmitIdeaForm from "@/components/SubmitIdeaForm";
import IdeasBoardClient from "@/components/IdeasBoardClient";
import ScrollTypewriter from "@/components/landing/ScrollTypewriter";
import NeuralOrbCanvas from "@/components/landing/NeuralOrbCanvas";
import type { Status } from "@/lib/db";
import logo from "@/app/logos/nu_logo_name.png";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();

  const { rows: ideas } = await pool.query(
    `SELECT i.id,
            i.title,
            COALESCE(i.description, i."longDesc") AS description,
            COALESCE(i.category, 'Other') AS category,
            i."externalLink",
            i."createdAt",
            u.name AS "authorName",
            COALESCE(u.username, '') AS "authorUsername",
            u.avatar AS "authorAvatar",
            COUNT(DISTINCT c.id)::int AS "commentCount",
            COUNT(v.id)::int AS "voteCount",
            BOOL_OR(v."userId" = $1) AS "votedByMe"
      FROM "Idea" i
      JOIN "User" u ON u.id = i."userId"
      LEFT JOIN "Vote" v ON v."ideaId" = i.id
      LEFT JOIN "Comment" c ON c."ideaId" = i.id
      GROUP BY i.id, u.name, u.username, u.avatar
      ORDER BY "voteCount" DESC, i."createdAt" DESC`,
    [session?.user?.id ?? ""]
  );

  let dashboardIdeas: Array<{
    id: string;
    title: string;
    shortDesc: string;
    status: Status;
    voteCount: number;
    createdAt: Date;
  }> = [];
  let votesCast = 0;
  let totalIdeaVotes = 0;

  if (session?.user?.id) {
    const { rows } = await pool.query(
      `SELECT i.id, i.title, COALESCE(i.description, i."shortDesc") AS "shortDesc", i.status, i."createdAt",
              COUNT(v.id)::int AS "voteCount"
       FROM "Idea" i
       LEFT JOIN "Vote" v ON v."ideaId" = i.id
       WHERE i."userId" = $1
       GROUP BY i.id
       ORDER BY i."createdAt" DESC`,
      [session.user.id]
    );
    dashboardIdeas = rows as typeof dashboardIdeas;

    const { rows: votesCastRows } = await pool.query(
      `SELECT COUNT(*)::int AS count FROM "Vote" WHERE "userId" = $1`,
      [session.user.id]
    );
    votesCast = votesCastRows[0]?.count ?? 0;
    totalIdeaVotes = dashboardIdeas.reduce((sum, idea) => sum + idea.voteCount, 0);
  }

  return (
    <>
      {/* Intro hero */}
      <section id="hero" className="relative left-1/2 mb-10 w-screen max-w-[100vw] -translate-x-1/2 scroll-mt-28">
        <div className="hero-intro overflow-hidden">
          <NeuralOrbCanvas />
          <div className="relative z-10 mx-auto w-full max-w-6xl">
            <div className="text-center md:text-left">
              <div className="mb-6 flex justify-center md:justify-start">
                <div
                  aria-label="NextUp"
                  className="logo-mask"
                  style={{
                    WebkitMaskImage: `url(${logo.src})`,
                    maskImage: `url(${logo.src})`,
                    width: "132px",
                    height: "56px",
                  }}
                />
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">NextUp</p>
              <h1 className="hero-heading-shimmer text-[2rem] font-bold leading-tight md:text-[3.5rem]">Vote for What Gets Built</h1>
              <p className="hero-subtitle mx-auto mt-4 min-h-[4.2rem] text-sm text-muted md:mx-0 md:min-h-[3.1rem] md:text-base">
                <ScrollTypewriter
                  className="text-muted"
                  phrases={[
                    "Pitch software ideas, vote on the best ones, and the community decides what we build next.",
                    "Transparent prioritization — see momentum before we write a line of code.",
                    "Submit in seconds. Rally votes. Ship what actually matters.",
                  ]}
                />
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2 md:justify-start">
              {!session?.user?.id ? (
                <>
                  <Link href="/auth/signin" className="btn-primary magnetic-btn !px-7 !py-3.5 text-base">
                    Sign in to submit
                  </Link>
                  <Link href="#spotlight" className="btn-secondary magnetic-btn !px-7 !py-3.5 text-base">
                    Browse spotlight
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/submit" className="btn-primary magnetic-btn !px-7 !py-3.5 text-base">
                    Submit an idea
                  </Link>
                  <Link href="#spotlight" className="btn-secondary magnetic-btn !px-7 !py-3.5 text-base">
                    Browse spotlight
                  </Link>
                </>
              )}
              </div>

            </div>
          </div>
        </div>
      </section>

      <IdeasBoardClient
        initialIdeas={ideas.map((idea: Record<string, unknown>) => ({
          id: idea.id as string,
          title: idea.title as string,
          description: idea.description as string,
          category: idea.category as string,
          externalLink: (idea.externalLink as string | null) ?? null,
          createdAt: new Date(idea.createdAt as string | Date).toISOString(),
          voteCount: Number(idea.voteCount) || 0,
          authorName: idea.authorName as string,
          authorUsername: idea.authorUsername as string,
          authorAvatar: (idea.authorAvatar as string | null) ?? null,
          votedByMe: Boolean(idea.votedByMe),
          commentCount: Number(idea.commentCount) || 0,
        }))}
        loggedIn={Boolean(session?.user?.id)}
      />

      {/* Main two-column workspace */}
      <section id="workspace" className="scroll-mt-28 mb-12 grid gap-6 lg:grid-cols-12">
        <div id="dashboard" className="scroll-mt-28 lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Dashboard</h2>
            {!session?.user?.id && (
              <Link href="/auth/signin" className="btn-secondary !py-2 !px-4 text-sm">
                Sign in
              </Link>
            )}
          </div>

          {!session?.user?.id ? (
            <div className="card-elevated py-10 text-center">
              <p className="mb-4 text-muted">Sign in to view and manage your submissions.</p>
              <Link href="/auth/signin" className="btn-primary">Sign In</Link>
            </div>
          ) : (
            <>
              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Ideas</p>
                  <p className="mt-1 text-xl font-bold">{dashboardIdeas.length}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Votes received</p>
                  <p className="mt-1 text-xl font-bold">{totalIdeaVotes}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Votes cast</p>
                  <p className="mt-1 text-xl font-bold">{votesCast}</p>
                </div>
              </div>

              {dashboardIdeas.length === 0 ? (
                <div className="rounded-xl border border-border bg-card py-10 text-center">
                  <p className="text-muted">You have not submitted any ideas yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {dashboardIdeas.slice(0, 4).map((idea) => (
                    <div key={idea.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex items-center gap-2">
                            <Link
                              href={`/idea/${idea.id}`}
                              className="truncate text-base font-semibold transition-colors hover:text-foreground"
                            >
                              {idea.title}
                            </Link>
                            <StatusBadge status={idea.status} />
                          </div>
                          <p className="mb-2 text-sm text-muted">{idea.shortDesc}</p>
                          <p className="text-xs text-muted">
                            {new Date(idea.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}{" "}
                            · {idea.voteCount} votes
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/idea/${idea.id}/edit`}
                            className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-card-hover"
                          >
                            Edit
                          </Link>
                          <DeleteIdeaButton ideaId={idea.id} redirectTo="/#dashboard" />
                        </div>
                      </div>
                    </div>
                  ))}
                  {dashboardIdeas.length > 4 && (
                    <Link href="/dashboard" className="text-sm font-medium text-foreground hover:text-muted">
                      View all {dashboardIdeas.length} submissions →
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div id="submit" className="scroll-mt-28 lg:col-span-5">
          <h2 className="mb-4 text-xl font-bold tracking-tight">Submit an Idea</h2>
          <SubmitIdeaForm compact />
        </div>
      </section>

    </>
  );
}
