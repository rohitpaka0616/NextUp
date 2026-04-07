"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReportButton from "@/components/ReportButton";

type SortMode = "top" | "new" | "trending";

interface IdeaItem {
  id: string;
  title: string;
  description: string;
  category: string;
  externalLink: string | null;
  createdAt: string;
  voteCount: number;
  authorName: string;
  authorUsername: string;
  authorAvatar: string | null;
  votedByMe: boolean;
  commentCount: number;
}

function relTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 animate-pulse">
      <div className="h-4 w-24 rounded bg-white/10" />
      <div className="mt-3 h-5 w-2/3 rounded bg-white/10" />
      <div className="mt-2 h-4 w-full rounded bg-white/10" />
      <div className="mt-2 h-4 w-4/5 rounded bg-white/10" />
    </div>
  );
}

export default function IdeasBoardClient({
  initialIdeas,
  loggedIn,
}: {
  initialIdeas: IdeaItem[];
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [ideas, setIdeas] = useState(initialIdeas);
  const [sort, setSort] = useState<SortMode>("top");
  const [loading, setLoading] = useState(false);
  const [authPrompt, setAuthPrompt] = useState(false);

  const sortedIdeas = useMemo(() => ideas, [ideas]);

  async function changeSort(next: SortMode) {
    if (next === sort) return;
    setSort(next);
    setLoading(true);
    try {
      const res = await fetch(`/api/ideas?sort=${next}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setIdeas(data);
    } finally {
      setLoading(false);
    }
  }

  async function toggleVote(ideaId: string) {
    if (!loggedIn) {
      setAuthPrompt(true);
      return;
    }
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === ideaId
          ? {
              ...idea,
              votedByMe: !idea.votedByMe,
              voteCount: idea.votedByMe ? idea.voteCount - 1 : idea.voteCount + 1,
            }
          : idea
      )
    );
    const res = await fetch(`/api/ideas/${ideaId}/vote`, { method: "POST" });
    if (!res.ok) {
      router.refresh();
    }
  }

  return (
    <section id="spotlight" className="scroll-mt-28 mb-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold tracking-tight">Ideas Board</h2>
        <div className="flex rounded-xl border border-border bg-card p-1">
          {(["top", "new", "trending"] as SortMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => changeSort(mode)}
              className={`rounded-lg px-3 py-1.5 text-sm capitalize transition-colors duration-200 ${
                sort === mode ? "bg-white/10 text-white" : "text-muted hover:text-white"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {authPrompt && !loggedIn && (
        <div className="mb-4 rounded-xl border border-border bg-card p-3 text-sm text-muted">
          Sign in to vote. <Link href="/auth/signin" className="text-white underline">Go to sign in</Link>
        </div>
      )}

      {loading ? (
        <div className="grid gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : sortedIdeas.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <p className="text-lg font-semibold text-white">No ideas yet</p>
          <p className="mt-2 text-sm text-muted">Submit the first idea to start the board.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {sortedIdeas.map((idea) => (
            <article key={idea.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="mb-2 text-xs uppercase tracking-wide text-accent">{idea.category}</p>
                  <Link href={`/ideas/${idea.id}`} className="text-lg font-semibold text-white hover:text-accent">
                    {idea.title}
                  </Link>
                  <p className="mt-2 line-clamp-3 text-sm text-muted">{idea.description}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                    {idea.authorAvatar ? (
                      <Link href={`/u/${idea.authorUsername || idea.authorName}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={idea.authorAvatar} alt="" className="h-5 w-5 rounded-full object-cover" />
                      </Link>
                    ) : (
                      <span className="h-5 w-5 rounded-full bg-white/10" />
                    )}
                    <Link href={`/u/${idea.authorUsername || idea.authorName}`} className="hover:text-white">
                      @{idea.authorUsername || idea.authorName}
                    </Link>
                    <span>·</span>
                    <span>{relTime(idea.createdAt)}</span>
                    <span>·</span>
                    <span>{idea.commentCount} comments</span>
                  </div>
                  {idea.externalLink ? (
                    <a
                      href={idea.externalLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-xs text-accent hover:underline"
                    >
                      External link
                    </a>
                  ) : null}
                </div>
                <button
                  onClick={() => toggleVote(idea.id)}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                    idea.votedByMe ? "border-accent bg-accent/15 text-white" : "border-border text-muted hover:text-white"
                  }`}
                >
                  ▲ {idea.voteCount}
                </button>
              </div>
              {loggedIn ? (
                <div className="mt-2">
                  <ReportButton targetType="idea" targetId={idea.id} />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
