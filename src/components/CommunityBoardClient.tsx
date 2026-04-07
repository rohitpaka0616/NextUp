"use client";

import { useState } from "react";
import Link from "next/link";
import MarkdownContent from "@/components/MarkdownContent";

type SortMode = "top" | "new" | "hot";

interface CommunityPost {
  id: string;
  title: string;
  body: string;
  tag: string;
  createdAt: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string | null;
  commentCount: number;
}

function relTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function CommunityBoardClient({
  initialPosts,
}: {
  initialPosts: CommunityPost[];
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [sort, setSort] = useState<SortMode>("top");
  const [loading, setLoading] = useState(false);

  async function onSort(next: SortMode) {
    if (next === sort) return;
    setSort(next);
    setLoading(true);
    try {
      const res = await fetch(`/api/community?sort=${next}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setPosts(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Discussions</h2>
        <div className="flex rounded-lg border border-border bg-card p-1">
          {(["top", "new", "hot"] as SortMode[]).map((m) => (
            <button
              key={m}
              onClick={() => void onSort(m)}
              className={`rounded px-2.5 py-1 text-xs uppercase tracking-wide transition-colors duration-200 ${
                sort === m ? "bg-white/10 text-white" : "text-muted hover:text-white"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse">
              <div className="h-4 w-32 rounded bg-white/10" />
              <div className="mt-2 h-4 w-2/3 rounded bg-white/10" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-base font-semibold text-white">No discussions yet</p>
          <p className="mt-1 text-sm text-muted">Be the first to start a thread.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <article key={post.id} className="rounded-xl border border-border bg-card p-5">
              <p className="mb-2 text-xs uppercase tracking-wide text-accent">{post.tag}</p>
              <Link href={`/community/${post.id}`} className="text-lg font-semibold text-white hover:text-accent">
                {post.title}
              </Link>
              <div className="mt-2 line-clamp-3 text-sm text-muted">
                <MarkdownContent content={post.body} />
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                <Link href={`/u/${post.authorUsername || post.authorName}`} className="hover:text-white">
                  @{post.authorUsername || post.authorName}
                </Link>
                <span>·</span>
                <span>{relTime(post.createdAt)}</span>
                <span>·</span>
                <span>{post.commentCount} comments</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
