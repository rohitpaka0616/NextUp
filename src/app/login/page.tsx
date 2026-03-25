"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                setError("Invalid email or password");
                return;
            }

            router.push("/");
            router.refresh();
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto max-w-sm pt-12">
            <h1 className="mb-2 text-center text-3xl font-bold">Welcome back</h1>
            <p className="mb-8 text-center text-muted">
                Sign in to vote and submit ideas
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                    <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                        {error}
                    </div>
                )}

                <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none"
                    />
                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="mb-1.5 block text-sm font-medium"
                    >
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 cursor-pointer rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                    {loading ? "Signing in…" : "Sign In"}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-accent hover:underline">
                    Create one
                </Link>
            </p>
        </div>
    );
}
