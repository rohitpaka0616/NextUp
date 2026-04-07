"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AI_PROMPT_MAX } from "@/lib/limits";

interface SubmitIdeaFormProps {
    compact?: boolean;
}

export default function SubmitIdeaForm({ compact = false }: SubmitIdeaFormProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [form, setForm] = useState({
        title: "",
        description: "",
        category: "Feature",
        externalLink: "",
    });
    const [ideaPrompt, setIdeaPrompt] = useState("");
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
                <p className="mb-5 text-muted">Sign in to vote, comment or submit.</p>
                <Link href="/auth/signin" className="btn-primary">
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
            const payload = {
                title: form.title,
                shortDesc: form.description.slice(0, 280),
                longDesc: form.description,
                category: form.category,
                externalLink: form.externalLink,
            };

            const res = await fetch("/api/ideas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Failed to submit idea");
                return;
            }

            router.refresh();
            setForm({ title: "", description: "", category: "Feature", externalLink: "" });
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
            setForm((prev) => ({
                ...prev,
                title: data.title ?? prev.title,
                description: data.longDesc ?? prev.description,
            }));
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
                        className="btn-secondary !px-3 !py-2 text-xs disabled:opacity-50"
                    >
                        {generating ? "Generating..." : "Generate"}
                    </button>
                </div>
                <textarea
                    id="ideaPrompt"
                    rows={2}
                    value={ideaPrompt}
                    maxLength={AI_PROMPT_MAX}
                    onChange={(e) => setIdeaPrompt(e.target.value)}
                    placeholder="Describe what you want: target users, problem, domain, constraints..."
                    className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
                />
                <p className="mt-2 text-xs text-muted">
                    AI fills title and description. ({ideaPrompt.length}/{AI_PROMPT_MAX} characters)
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
                    maxLength={80}
                    placeholder="Give your idea a clear title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
                />
            </div>

            <div>
                <label htmlFor="description" className="mb-1.5 block text-sm font-medium">
                    Description (Markdown)
                </label>
                <textarea
                    id="description"
                    required
                    rows={compact ? 5 : 6}
                    maxLength={1000}
                    placeholder="Write a concise markdown description..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
                />
                <p className="mt-1 text-xs text-muted">
                    {form.description.length} / 1000 characters
                </p>
            </div>

            <div>
                <label htmlFor="category" className="mb-1.5 block text-sm font-medium">
                    Category
                </label>
                <select
                    id="category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                >
                    {["Feature", "Bug Fix", "Integration", "Tooling", "Other"].map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label htmlFor="externalLink" className="mb-1.5 block text-sm font-medium">
                    External link (optional)
                </label>
                <input
                    id="externalLink"
                    type="url"
                    value={form.externalLink}
                    onChange={(e) => setForm({ ...form, externalLink: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
                {submitting ? "Submitting…" : "Submit Idea"}
            </button>
        </form>
    );
}
