"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function SubmitPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [form, setForm] = useState({ title: "", shortDesc: "", longDesc: "" });
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (status === "loading") {
        return (
            <div className="py-20 text-center text-muted">Loading…</div>
        );
    }

    if (!session) {
        return (
            <div className="py-20 text-center">
                <h2 className="mb-2 text-2xl font-bold">Sign in required</h2>
                <p className="mb-6 text-muted">
                    You need to be signed in to submit an idea.
                </p>
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

    return (
        <div className="mx-auto max-w-2xl">
            <h1 className="mb-2 text-3xl font-bold">Submit Your Idea</h1>
            <p className="mb-8 text-muted">
                Pitch an idea. Let the community vote. We’ll build the winner.
            </p>

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
                        maxLength={120}
                        placeholder="e.g. AI-Powered Code Review Tool"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
                    />
                </div>

                <div>
                    <label
                        htmlFor="shortDesc"
                        className="mb-1.5 block text-sm font-medium"
                    >
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
                    <label
                        htmlFor="longDesc"
                        className="mb-1.5 block text-sm font-medium"
                    >
                        Full Description
                    </label>
                    <textarea
                        id="longDesc"
                        required
                        rows={6}
                        placeholder="Explain the problem, the solution, who it's for…"
                        value={form.longDesc}
                        onChange={(e) => setForm({ ...form, longDesc: e.target.value })}
                        className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
                    />
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full disabled:opacity-50"
                >
                    {submitting ? "Submitting…" : "Submit Idea"}
                </button>
            </form>
        </div>
    );
}
