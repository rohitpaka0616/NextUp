"use client";

import Link from "next/link";
import { useState } from "react";

interface NotificationItem {
  id: string;
  type: string;
  referenceId: string;
  read: boolean;
  createdAt: string;
}

function messageFor(n: NotificationItem) {
  if (n.type === "IDEA_COMMENT") return "Someone commented on your idea";
  if (n.type === "COMMENT_REPLY") return "Someone replied to your comment";
  if (n.type === "IDEA_VOTE_MILESTONE") return "Your idea hit a vote milestone";
  return "New notification";
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const unread = items.filter((i) => !i.read).length;

  async function load() {
    const res = await fetch("/api/notifications", { cache: "no-store" });
    if (res.ok) setItems(await res.json());
  }

  async function markAllRead() {
    const res = await fetch("/api/notifications", { method: "PATCH" });
    if (res.ok) void load();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void load();
        }}
        className="relative rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white/80 transition-colors duration-200 hover:bg-white/10"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-white/10 bg-[#0e1020] p-2 shadow-[0_16px_34px_rgba(0,0,0,0.35)]">
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-sm font-semibold text-white">Notifications</p>
            <button className="text-xs text-muted hover:text-white" onClick={markAllRead}>
              Mark all as read
            </button>
          </div>
          <div className="max-h-80 space-y-1 overflow-auto">
            {items.length === 0 ? (
              <div className="rounded-lg border border-border bg-background px-3 py-4 text-sm text-muted">
                No notifications yet.
              </div>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  href={n.referenceId}
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg border px-3 py-2 text-sm transition-colors duration-200 ${
                    n.read ? "border-border bg-background text-muted" : "border-accent/40 bg-accent/10 text-white"
                  }`}
                >
                  {messageFor(n)}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
