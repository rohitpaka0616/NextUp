import Link from "next/link";
import { pool } from "@/lib/db";
import { auth } from "@/lib/auth";
import IdeaCard from "@/components/IdeaCard";
import StatusBadge from "@/components/StatusBadge";
import DeleteIdeaButton from "@/components/DeleteIdeaButton";
import SubmitIdeaForm from "@/components/SubmitIdeaForm";
import AnalyticsOverview from "@/components/AnalyticsOverview";
import type { Status } from "@/lib/db";
import { pickMostTrendingIdea } from "@/lib/trending";
import logo from "@/app/logos/nu_logo_name.png";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();

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

  const topThreeVotes = ideas
    .slice(0, 3)
    .reduce((sum: number, idea: Record<string, unknown>) => sum + (idea.voteCount as number), 0);
  const topVoteCount = (ideas[0]?.voteCount as number | undefined) ?? 0;
  const totalVotes = ideas.reduce(
    (sum: number, idea: Record<string, unknown>) => sum + ((idea.voteCount as number) || 0),
    0
  );
  const conversionPct = totalVotes > 0 ? Math.min(247, Math.round((topVoteCount / totalVotes) * 1000)) : 0;
  const trendingPick = pickMostTrendingIdea(
    ideas.map((idea: Record<string, unknown>) => ({
      id: idea.id as string,
      title: idea.title as string,
      shortDesc: idea.shortDesc as string,
      voteCount: (idea.voteCount as number) || 0,
      createdAt: idea.createdAt as Date,
    }))
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
      `SELECT i.id, i.title, i."shortDesc", i.status, i."createdAt",
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
      <section className="mb-10">
        <div className="hero-intro">
          <div className="relative z-10 grid gap-8 md:grid-cols-12 md:items-center">
            <div className="md:col-span-7 text-center md:text-left">
              <div className="mb-4 flex justify-center md:justify-start">
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
              <h1 className="text-3xl font-bold leading-tight md:text-4xl">Vote for What Gets Built</h1>
              <p className="mt-2 text-sm text-muted md:text-base">
                Pitch software ideas, vote on the best ones, and the community decides what we build next.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2 md:justify-start">
              {!session?.user?.id ? (
                <>
                  <Link href="/login" className="btn-primary !px-4 !py-2.5 text-sm">
                    Sign in to submit
                  </Link>
                  <Link href="#ideas" className="btn-secondary !px-4 !py-2.5 text-sm">
                    Browse ideas
                  </Link>
                </>
              ) : (
                <>
                  <Link href="#submit" className="btn-primary !px-4 !py-2.5 text-sm">
                    Submit an idea
                  </Link>
                  <Link href="#ideas" className="btn-secondary !px-4 !py-2.5 text-sm">
                    Browse ideas
                  </Link>
                </>
              )}
              </div>
            </div>

            <div className="hidden md:block md:col-span-5">
              <div aria-hidden="true" className="hero-preview">
                <div className="hero-preview-topbar" />
                <div className="hero-preview-title" />
                <div className="hero-preview-buttons">
                  <div />
                  <div />
                </div>
                <div className="hero-preview-grid">
                  <div />
                  <div />
                  <div />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AnalyticsOverview
        topVoteCount={topVoteCount}
        conversionPct={conversionPct}
        ideasCount={ideas.length}
        topThreeVotes={topThreeVotes}
        totalVotes={totalVotes}
        yourIdeas={dashboardIdeas.length}
        trendingPick={trendingPick}
      />

      {/* Main two-column workspace */}
      <section className="mb-12 grid gap-6 lg:grid-cols-12">
        <div id="dashboard" className="scroll-mt-24 lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Dashboard</h2>
            {!session?.user?.id && (
              <Link href="/login" className="btn-secondary !py-2 !px-4 text-sm">
                Sign in
              </Link>
            )}
          </div>

          {!session?.user?.id ? (
            <div className="card-elevated py-10 text-center">
              <p className="mb-4 text-muted">Sign in to view and manage your submissions.</p>
              <Link href="/login" className="btn-primary">Sign In</Link>
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

        <div id="submit" className="scroll-mt-24 lg:col-span-5">
          <h2 className="mb-4 text-xl font-bold tracking-tight">Submit an Idea</h2>
          <SubmitIdeaForm compact />
        </div>
      </section>

      {/* Ideas list */}
      <section id="ideas" className="scroll-mt-24">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">
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
