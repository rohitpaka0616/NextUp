"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { normalizeEmail } from "@/lib/validation";

export default function SignInPage() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setStatus("");
    const res = await signIn("credentials", {
      email: normalizeEmail(email),
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  async function handleMagicLink() {
    if (!email.trim()) {
      setError("Enter your email first");
      return;
    }
    setLoading(true);
    setError("");
    setStatus("");
    const res = await signIn("email", {
      email: normalizeEmail(email),
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (res?.error) {
      setError("Could not send magic link. Check email provider config.");
      return;
    }
    setStatus("Magic link sent. Check your inbox.");
  }

  return (
    <div className="mx-auto max-w-md pt-14">
      <div className="card-elevated p-6 sm:p-7">
        <h1 className="text-center text-3xl font-bold text-white">Sign in</h1>
        <p className="mt-2 text-center text-sm text-muted">
          Sign in to vote, comment or submit.
        </p>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="btn-secondary magnetic-btn mt-6 w-full !py-3 text-sm"
        >
          Continue with Google
        </button>

        <div className="my-5 text-center text-xs uppercase tracking-[0.14em] text-white/45">or</div>

        <form onSubmit={handlePasswordSignIn} className="space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
          />
          <button type="submit" disabled={loading} className="btn-primary magnetic-btn w-full !py-3 text-sm disabled:opacity-60">
            {loading ? "Signing in..." : "Sign in with email/password"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleMagicLink}
          disabled={loading}
          className="btn-secondary magnetic-btn mt-3 w-full !py-3 text-sm disabled:opacity-60"
        >
          Send magic link
        </button>

        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        {status ? <p className="mt-3 text-sm text-success">{status}</p> : null}

        <p className="mt-6 text-center text-sm text-muted">
          New here?{" "}
          <Link href="/register" className="text-white hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
