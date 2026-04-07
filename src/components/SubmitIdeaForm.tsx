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
    const [form, setForm] = useState({
        title: "",
        description: "",
        category: "Feature",
        externalLink: "",
    });
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

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

    return (
        <form onSubmit={handleSubmit} className="card-elevated flex flex-col gap-6 p-6">
            {error && (
                <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                    {error}
                </div>
            )}

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
