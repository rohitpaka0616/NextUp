"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
    href: string;
    children: React.ReactNode;
    match?: "exact" | "prefix";
    variant?: "primary" | "muted";
    className?: string;
}

export default function NavLink({
    href,
    children,
    match = "exact",
    variant = "muted",
    className = "",
}: NavLinkProps) {
    const pathname = usePathname();
    const hrefPath = href.split("#")[0] || "/";
    const isActive =
        match === "prefix"
            ? pathname === hrefPath || pathname.startsWith(`${hrefPath}/`)
            : pathname === hrefPath;

    if (variant === "primary") {
        const base = "btn-primary !py-2 !px-4 text-sm";
        const active = isActive ? " ring-2 ring-accent/35 shadow-[0_8px_18px_rgba(222,224,254,0.28)]" : "";
        return (
            <Link href={href} aria-current={isActive ? "page" : undefined} className={`${base}${active} ${className}`}>
                {children}
            </Link>
        );
    }

    const base = "rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors";
    const inactive = "text-muted hover:text-foreground";
    const active = "bg-accent/10 text-foreground";

    return (
        <Link
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`${base} ${isActive ? active : inactive} ${className}`}
        >
            {children}
        </Link>
    );
}
