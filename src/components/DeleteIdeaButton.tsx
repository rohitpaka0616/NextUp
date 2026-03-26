"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteIdeaButtonProps {
    ideaId: string;
    redirectTo?: string;
}

export default function DeleteIdeaButton({
    ideaId,
    redirectTo = "/profile",
}: DeleteIdeaButtonProps) {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");

    async function handleDelete() {
        const confirmed = window.confirm(
            "Are you sure you want to delete this submission? This cannot be undone."
        );
        if (!confirmed) return;

        setDeleting(true);
        setError("");

        try {
            const res = await fetch(`/api/ideas/${ideaId}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Failed to delete submission");
                return;
            }
            router.push(redirectTo);
            router.refresh();
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="flex flex-col items-end gap-2">
            <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition hover:bg-danger/20 disabled:opacity-50"
            >
                {deleting ? "Deleting..." : "Delete"}
            </button>
            {error && <p className="text-sm text-danger">{error}</p>}
        </div>
    );
}
