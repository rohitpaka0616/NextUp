"use client";

import { useState } from "react";

interface ReportItem {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  createdAt: string;
  reporterUsername: string;
  ideaTitle: string | null;
  commentBody: string | null;
}

export default function ReportsAdminClient({ initialReports }: { initialReports: ReportItem[] }) {
  const [reports, setReports] = useState(initialReports);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function act(reportId: string, action: "delete" | "dismiss") {
    setLoadingId(reportId);
    const res = await fetch(`/api/admin/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoadingId(null);
    if (res.ok) {
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    }
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-base font-semibold text-white">No reports</p>
        <p className="mt-1 text-sm text-muted">All clear right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <article key={r.id} className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-accent">{r.targetType}</p>
          <p className="mt-2 text-sm text-white">
            {r.targetType === "idea" ? r.ideaTitle || "Idea unavailable" : r.commentBody || "Comment unavailable"}
          </p>
          <p className="mt-2 text-xs text-muted">
            Reported by @{r.reporterUsername} · {r.reason} · {new Date(r.createdAt).toLocaleString()}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => void act(r.id, "delete")}
              disabled={loadingId === r.id}
              className="btn-primary !px-3 !py-1.5 text-xs disabled:opacity-60"
            >
              Delete Content
            </button>
            <button
              onClick={() => void act(r.id, "dismiss")}
              disabled={loadingId === r.id}
              className="btn-secondary !px-3 !py-1.5 text-xs disabled:opacity-60"
            >
              Dismiss Report
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
