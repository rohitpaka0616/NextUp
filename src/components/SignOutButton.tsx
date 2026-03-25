"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="cursor-pointer text-sm text-muted transition-colors hover:text-danger"
        >
            Sign out
        </button>
    );
}
