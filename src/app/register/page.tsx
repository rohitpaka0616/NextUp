"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    isValidDisplayName,
    isValidEmail,
    normalizeEmail,
} from "@/lib/validation";

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        if (!isValidDisplayName(form.name)) {
            setError("Enter a display name (2–80 characters, including at least one letter).");
            return;
        }
        if (!isValidEmail(form.email)) {
            setError("Please enter a valid email address.");
            return;
        }
        setLoading(true);

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name.trim(),
                    email: normalizeEmail(form.email),
                    password: form.password,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Registration failed");
                return;
            }

            // Auto sign-in after registration
            const signInRes = await signIn("credentials", {
                email: normalizeEmail(form.email),
                password: form.password,
                redirect: false,
            });

            if (signInRes?.error) {
                // Registration succeeded but auto-login failed — redirect to login
                router.push("/login");
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
            <h1 className="mb-2 text-center text-3xl font-bold">Create an account</h1>
            <p className="mb-8 text-center text-muted">
                Join the community and start voting
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                    <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                        {error}
                    </div>
                )}

                <div>
                    <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                        Name
                    </label>
                    <input
                        id="name"
                        type="text"
                        required
                        maxLength={80}
                        autoComplete="name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none"
                    />
                </div>

                <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        required
                        autoComplete="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                        minLength={6}
                        autoComplete="new-password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-muted">Minimum 6 characters</p>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 cursor-pointer rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                    {loading ? "Creating account…" : "Create Account"}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
                Already have an account?{" "}
                <Link href="/login" className="text-foreground hover:underline">
                    Sign in
                </Link>
            </p>
        </div>
    );
}
