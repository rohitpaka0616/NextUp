"use client";

import { signOut } from "next-auth/react";

interface SignOutButtonProps {
    compact?: boolean;
}

export default function SignOutButton({ compact = false }: SignOutButtonProps) {
    return (
        <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className={`shrink-0 cursor-pointer whitespace-nowrap text-white/75 transition-colors duration-200 hover:text-danger ${compact ? "w-full rounded-lg px-0.5 py-1.5 text-left text-sm hover:bg-white/5" : "text-sm"}`}
        >
            Sign out
        </button>
    );
}
