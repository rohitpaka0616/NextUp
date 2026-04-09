"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BIO_MAX_CHARS } from "@/lib/profileLimits";

export default function ProfileHeaderClient({
  isOwner,
  initialName,
  initialBio,
  initialAvatar,
  username,
  joinDate,
}: {
  isOwner: boolean;
  initialName: string;
  initialBio: string;
  initialAvatar: string | null;
  username: string;
  joinDate: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [avatar, setAvatar] = useState(initialAvatar ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onFileChange(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      setAvatar(value);
    };
    reader.readAsDataURL(file);
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, avatar }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save profile");
        return;
      }
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl font-bold text-white">
              {name[0]?.toUpperCase() ?? "U"}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">{name}</h1>
            <p className="text-sm text-muted">@{username}</p>
            <p className="mt-1 text-xs text-muted">Joined {joinDate}</p>
          </div>
        </div>
        {isOwner ? (
          <button className="btn-secondary !px-3 !py-2 text-sm" onClick={() => setEditing((v) => !v)}>
            {editing ? "Cancel" : "Edit Profile"}
          </button>
        ) : null}
      </div>
      <p className="mt-4 text-sm text-muted">{bio || "No bio yet."}</p>

      {editing && isOwner ? (
        <div className="mt-4 rounded-xl border border-border bg-background p-4">
          {error ? <p className="mb-2 text-sm text-danger">{error}</p> : null}
          <label className="mb-1 block text-xs text-muted">Display name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            className="mb-3 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
          />
          <label className="mb-1 block text-xs text-muted">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX_CHARS))}
            maxLength={BIO_MAX_CHARS}
            rows={3}
            className="mb-3 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
          />
          <p className="-mt-2 mb-3 text-xs text-white/40">
            {bio.length} / {BIO_MAX_CHARS} characters
          </p>
          <label className="mb-1 block text-xs text-muted">Avatar upload</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => void onFileChange(e.target.files?.[0] ?? null)}
            className="mb-3 w-full text-xs text-muted"
          />
          <button className="btn-primary !px-3 !py-2 text-sm disabled:opacity-60" disabled={saving} onClick={save}>
            {saving ? "Saving..." : "Save profile"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
