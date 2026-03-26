"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface SubmitIdeaFormProps {
    compact?: boolean;
}

export default function SubmitIdeaForm({ compact = false }: SubmitIdeaFormProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [ideaPrompt, setIdeaPrompt] = useState("");
    const [form, setForm] = useState({ title: "", shortDesc: "", longDesc: "" });
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [generating, setGenerating] = useState(false);

    if (status === "loading") {
        return <div className="py-10 text-center text-muted">Loading…</div>;
    }

    if (!session) {
        return (
            <div className="rounded-xl border border-border bg-card py-10 text-center">
                <h3 className="mb-2 text-xl font-bold">Sign in required</h3>
                <p className="mb-5 text-muted">You need to be signed in to submit an idea.</p>
                <Link href="/login" className="btn-primary">
                    Sign In
                </Link>
            </div>
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            const res = await fetch("/api/ideas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Failed to submit idea");
                return;
            }

            const idea = await res.json();
            router.push(`/idea/${idea.id}`);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleGenerateWithAi() {
        setError("");
        setGenerating(true);

        try {
            const promptToUse =
                ideaPrompt.trim() ||
                "Generate a high-impact software startup idea for developers and small teams.";

            const res = await fetch("/api/ideas/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: promptToUse }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Failed to generate idea with AI");
                return;
            }

            setForm({
                title: data.title ?? "",
                shortDesc: data.shortDesc ?? "",
                longDesc: data.longDesc ?? "",
            });
        } catch {
            setError("Failed to generate idea. Please try again.");
        } finally {
            setGenerating(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="card-elevated flex flex-col gap-6 p-6">
            {error && (
                <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                    {error}
                </div>
            )}

            <div className="rounded-xl border border-border bg-card-hover p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                    <label htmlFor="ideaPrompt" className="text-sm font-medium">
                        Need help? Generate with AI
                    </label>
                    <button
                        type="button"
                        onClick={handleGenerateWithAi}
                        disabled={generating}
                        className="btn-secondary !py-2 !px-3 text-xs disabled:opacity-50"
                    >
                        {generating ? "Generating..." : "Generate"}
                    </button>
                </div>
                <textarea
                    id="ideaPrompt"
                    rows={2}
                    value={ideaPrompt}
                    onChange={(e) => setIdeaPrompt(e.target.value)}
                    placeholder="Describe what you want: target users, problem, domain, constraints..."
                    className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
                />
                <p className="mt-2 text-xs text-muted">
                    AI fills Title, Short Description, and Full Description. You can edit before submitting.
                </p>
            </div>

            <div>
                <label htmlFor="title" className="mb-1.5 block text-sm font-medium">
                    Title
                </label>
                <input
                    id="title"
                    type="text"
                    required
                    maxLength={120}
                    placeholder="e.g. AI-Powered Code Review Tool"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
                />
            </div>

            <div>
                <label htmlFor="shortDesc" className="mb-1.5 block text-sm font-medium">
                    Short Description
                </label>
                <input
                    id="shortDesc"
                    type="text"
                    required
                    maxLength={280}
                    placeholder="One-liner that explains the value"
                    value={form.shortDesc}
                    onChange={(e) => setForm({ ...form, shortDesc: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
                />
            </div>

            <div>
                <label htmlFor="longDesc" className="mb-1.5 block text-sm font-medium">
                    Full Description
                </label>
                <textarea
                    id="longDesc"
                    required
                    rows={compact ? 5 : 6}
                    placeholder="Explain the problem, the solution, who it's for…"
                    value={form.longDesc}
                    onChange={(e) => setForm({ ...form, longDesc: e.target.value })}
                    className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
                />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
                {submitting ? "Submitting…" : "Submit Idea"}
            </button>
        </form>
    );
}
