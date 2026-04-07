"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import MarkdownContent from "@/components/MarkdownContent";
import ReportButton from "@/components/ReportButton";

type SortMode = "top" | "newest";

type CommentItem = {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string | null;
  parentCommentId: string | null;
  upvotes: number;
  createdAt: string;
};

function relTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Skeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 animate-pulse">
      <div className="h-3 w-28 rounded bg-white/10" />
      <div className="mt-3 h-4 w-full rounded bg-white/10" />
      <div className="mt-2 h-4 w-4/5 rounded bg-white/10" />
    </div>
  );
}

export default function CommentsThreadClient({
  entityId,
  apiBasePath,
  initialComments,
  sessionUserId,
}: {
  entityId: string;
  apiBasePath: string;
  initialComments: CommentItem[];
  sessionUserId: string | null;
}) {
  const [comments, setComments] = useState(initialComments);
  const [sort, setSort] = useState<SortMode>("top");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [prompt, setPrompt] = useState("");

  const roots = useMemo(() => comments.filter((c) => !c.parentCommentId), [comments]);
  const children = useMemo(() => comments.filter((c) => c.parentCommentId), [comments]);

  async function refresh(nextSort = sort) {
    setLoading(true);
    try {
      const res = await fetch(`${apiBasePath}/${entityId}/comments?sort=${nextSort}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setComments(data);
    } finally {
      setLoading(false);
    }
  }

  async function addComment(body: string, parentCommentId: string | null) {
    if (!sessionUserId) {
      setPrompt("Sign in to comment");
      return;
    }
    const tempId = `temp-${Date.now()}`;
    const optimistic: CommentItem = {
      id: tempId,
      body,
      authorId: sessionUserId,
      authorName: "You",
      authorUsername: "you",
      authorAvatar: null,
      parentCommentId,
      upvotes: 0,
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [optimistic, ...prev]);
    const res = await fetch(`${apiBasePath}/${entityId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, parentCommentId }),
    });
    if (!res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      return;
    }
    await refresh();
  }

  async function removeComment(commentId: string) {
    if (!sessionUserId) return;
    const snapshot = comments;
    setComments((prev) => prev.filter((c) => c.id !== commentId && c.parentCommentId !== commentId));
    const res = await fetch(`${apiBasePath}/${entityId}/comments/${commentId}`, { method: "DELETE" });
    if (!res.ok) setComments(snapshot);
  }

  async function saveEdit(commentId: string) {
    const snapshot = comments;
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, body: editDraft } : c)));
    setEditingId(null);
    const res = await fetch(`${apiBasePath}/${entityId}/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: editDraft }),
    });
    if (!res.ok) setComments(snapshot);
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-white">Comments ({comments.length})</h2>
        <div className="flex rounded-lg border border-border bg-card p-1">
          {(["top", "newest"] as SortMode[]).map((s) => (
            <button
              key={s}
              onClick={() => {
                setSort(s);
                void refresh(s);
              }}
              className={`rounded px-2.5 py-1 text-xs uppercase tracking-wide transition-colors duration-200 ${sort === s ? "bg-white/10 text-white" : "text-muted hover:text-white"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {!sessionUserId ? (
        <div className="mb-4 rounded-xl border border-border bg-card p-4 text-sm text-muted">
          Sign in to comment. <Link href="/auth/signin" className="text-white underline">Go to sign in</Link>
        </div>
      ) : (
        <div className="mb-4 rounded-xl border border-border bg-card p-4">
          <textarea
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={1000}
            placeholder="Write a comment in markdown..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => {
                if (!draft.trim()) return;
                void addComment(draft.trim(), null);
                setDraft("");
              }}
              className="btn-primary !px-4 !py-2 text-sm"
            >
              Comment
            </button>
          </div>
        </div>
      )}

      {prompt && !sessionUserId ? <p className="mb-3 text-sm text-muted">{prompt}</p> : null}

      {loading ? (
        <div className="space-y-3">
          <Skeleton />
          <Skeleton />
        </div>
      ) : roots.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-base font-semibold text-white">No comments yet</p>
          <p className="mt-1 text-sm text-muted">Start the discussion on this idea.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {roots.map((comment) => (
            <div key={comment.id} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center gap-2 text-xs text-muted">
                {comment.authorAvatar ? (
                  <Link href={`/u/${comment.authorUsername || comment.authorName}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={comment.authorAvatar} alt="" className="h-5 w-5 rounded-full object-cover" />
                  </Link>
                ) : (
                  <span className="h-5 w-5 rounded-full bg-white/10" />
                )}
                <Link href={`/u/${comment.authorUsername || comment.authorName}`} className="hover:text-white">
                  @{comment.authorUsername || comment.authorName}
                </Link>
                <span>·</span>
                <span>{relTime(comment.createdAt)}</span>
                <span>·</span>
                <span>{comment.upvotes} upvotes</span>
              </div>
              {editingId === comment.id ? (
                <div>
                  <textarea
                    rows={3}
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <div className="mt-2 flex gap-2">
                    <button className="btn-primary !px-3 !py-1.5 text-xs" onClick={() => void saveEdit(comment.id)}>
                      Save
                    </button>
                    <button className="btn-secondary !px-3 !py-1.5 text-xs" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <MarkdownContent content={comment.body} />
              )}
              <div className="mt-3 flex items-center gap-3 text-xs">
                {sessionUserId ? <ReportButton targetType="comment" targetId={comment.id} /> : null}
                <button
                  className="text-muted transition-colors duration-200 hover:text-white"
                  onClick={() => {
                    if (!sessionUserId) {
                      setPrompt("Sign in to comment");
                      return;
                    }
                    setReplyTo(comment.id);
                  }}
                >
                  Reply
                </button>
                {sessionUserId === comment.authorId ? (
                  <>
                    <button
                      className="text-muted transition-colors duration-200 hover:text-white"
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditDraft(comment.body);
                      }}
                    >
                      Edit
                    </button>
                    <button className="text-danger" onClick={() => void removeComment(comment.id)}>
                      Delete
                    </button>
                  </>
                ) : null}
              </div>

              {replyTo === comment.id && sessionUserId && (
                <div className="mt-3 rounded-lg border border-border bg-background p-3">
                  <textarea
                    rows={2}
                    value={replyDraft}
                    maxLength={1000}
                    onChange={(e) => setReplyDraft(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                    placeholder="Write a reply..."
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      className="btn-primary !px-3 !py-1.5 text-xs"
                      onClick={() => {
                        if (!replyDraft.trim()) return;
                        void addComment(replyDraft.trim(), comment.id);
                        setReplyDraft("");
                        setReplyTo(null);
                      }}
                    >
                      Reply
                    </button>
                    <button className="btn-secondary !px-3 !py-1.5 text-xs" onClick={() => setReplyTo(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-3 space-y-2">
                {children
                  .filter((child) => child.parentCommentId === comment.id)
                  .map((child) => (
                    <div key={child.id} className="rounded-lg border border-border bg-background p-3">
                      <div className="mb-1 flex items-center gap-2 text-xs text-muted">
                        <Link href={`/u/${child.authorUsername || child.authorName}`} className="hover:text-white">
                          @{child.authorUsername || child.authorName}
                        </Link>
                        <span>·</span>
                        <span>{relTime(child.createdAt)}</span>
                        <span>·</span>
                        <span>{child.upvotes} upvotes</span>
                      </div>
                      {editingId === child.id ? (
                        <div>
                          <textarea
                            rows={2}
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value)}
                            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                          />
                          <div className="mt-2 flex gap-2 text-xs">
                            <button className="btn-primary !px-3 !py-1.5 text-xs" onClick={() => void saveEdit(child.id)}>
                              Save
                            </button>
                            <button className="btn-secondary !px-3 !py-1.5 text-xs" onClick={() => setEditingId(null)}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <MarkdownContent content={child.body} />
                      )}
                      <div className="mt-2 flex gap-3 text-xs">
                        {sessionUserId ? <ReportButton targetType="comment" targetId={child.id} /> : null}
                        {sessionUserId === child.authorId ? (
                          <>
                          <button className="text-muted hover:text-white" onClick={() => {
                            setEditingId(child.id);
                            setEditDraft(child.body);
                          }}>
                            Edit
                          </button>
                          <button className="text-danger" onClick={() => void removeComment(child.id)}>
                            Delete
                          </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
