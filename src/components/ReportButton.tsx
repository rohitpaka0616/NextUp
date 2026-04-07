"use client";

import { useState } from "react";

const REASONS = ["Spam", "Inappropriate", "Off-topic", "Other"] as const;

export default function ReportButton({
  targetType,
  targetId,
}: {
  targetType: "idea" | "comment";
  targetId: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number]>("Spam");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setSaving(true);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, reason }),
    });
    setSaving(false);
    if (res.ok) {
      setDone(true);
      setTimeout(() => setOpen(false), 600);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setDone(false);
          setOpen(true);
        }}
        className="text-xs text-muted transition-colors duration-200 hover:text-white"
        title="Report"
      >
        🚩 Report
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
            <h3 className="text-base font-semibold text-white">Why are you reporting this?</h3>
            <div className="mt-3 space-y-2">
              {REASONS.map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="radio"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                  />
                  {r}
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-secondary !px-3 !py-1.5 text-xs" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary !px-3 !py-1.5 text-xs disabled:opacity-60" disabled={saving} onClick={submit}>
                {done ? "Reported" : saving ? "Submitting..." : "Submit report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
