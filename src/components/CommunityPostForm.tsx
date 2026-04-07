"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { COMMUNITY_POST_MAX } from "@/lib/limits";

export default function CommunityPostForm() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [tag, setTag] = useState("General");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch("/api/community", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, body, tag }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Failed to post");
                return;
            }
            setTitle("");
            setBody("");
            setTag("General");
            router.refresh();
        } catch {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="card-elevated p-5">
            <h2 className="mb-2 text-lg font-bold">Create post</h2>
            <p className="mb-4 text-sm text-muted">
                Suggest improvements, discuss what we ship next, or ask questions about the product.
            </p>
            {error && (
                <div className="mb-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                    {error}
                </div>
            )}
            <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                required
                className="mb-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                placeholder="Post title"
            />
            <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="mb-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
            >
                {["General", "Meta", "Announcements", "Off-Topic"].map((v) => (
                    <option key={v} value={v}>
                        {v}
                    </option>
                ))}
            </select>
            <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                maxLength={COMMUNITY_POST_MAX}
                required
                className="mb-2 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed"
                placeholder="What should we improve?"
            />
            <div className="mb-3 flex justify-between text-xs text-muted">
                <span>{body.length} / {COMMUNITY_POST_MAX}</span>
            </div>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                {loading ? "Posting…" : "Post"}
            </button>
        </form>
    );
}
