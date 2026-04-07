"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IDEA_LONG_MAX } from "@/lib/limits";

interface EditIdeaFormProps {
    ideaId: string;
    initialTitle: string;
    initialShortDesc: string;
    initialLongDesc: string;
}

export default function EditIdeaForm({
    ideaId,
    initialTitle,
    initialShortDesc,
    initialLongDesc,
}: EditIdeaFormProps) {
    const router = useRouter();
    const [form, setForm] = useState({
        title: initialTitle,
        shortDesc: initialShortDesc,
        longDesc: initialLongDesc,
    });
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setSaving(true);

        try {
            const res = await fetch(`/api/ideas/${ideaId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Failed to update idea");
                return;
            }

            router.push(`/idea/${ideaId}`);
            router.refresh();
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setSaving(false);
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
                    maxLength={120}
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
                    rows={8}
                    maxLength={IDEA_LONG_MAX}
                    value={form.longDesc}
                    onChange={(e) => setForm({ ...form, longDesc: e.target.value })}
                    className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
                />
                <p className="mt-1 text-xs text-muted">
                    {form.longDesc.length.toLocaleString()} / {IDEA_LONG_MAX.toLocaleString()} characters
                </p>
            </div>

            <div className="flex items-center gap-3">
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                    {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                    type="button"
                    onClick={() => router.push(`/idea/${ideaId}`)}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted transition hover:bg-card-hover"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
