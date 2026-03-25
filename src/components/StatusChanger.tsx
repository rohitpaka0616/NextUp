"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = [
    { value: "OPEN", label: "Open", color: "bg-badge-open" },
    { value: "BUILDING", label: "Building", color: "bg-badge-building" },
    { value: "SHIPPED", label: "Shipped", color: "bg-badge-shipped" },
] as const;

interface Props {
    ideaId: string;
    currentStatus: "OPEN" | "BUILDING" | "SHIPPED";
}

export default function StatusChanger({ ideaId, currentStatus }: Props) {
    const router = useRouter();
    const [status, setStatus] = useState(currentStatus);
    const [updating, setUpdating] = useState(false);

    async function handleChange(newStatus: string) {
        if (newStatus === status || updating) return;
        setUpdating(true);

        try {
            const res = await fetch(`/api/ideas/${ideaId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                setStatus(newStatus as Props["currentStatus"]);
                router.refresh();
            }
        } finally {
            setUpdating(false);
        }
    }

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted">Status:</span>
            <div className="flex gap-1.5">
                {STATUSES.map((s) => (
                    <button
                        key={s.value}
                        onClick={() => handleChange(s.value)}
                        disabled={updating}
                        className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-all ${status === s.value
                                ? `${s.color} text-white`
                                : "border border-border bg-card text-muted hover:border-accent/40 hover:text-foreground"
                            } disabled:opacity-50`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
