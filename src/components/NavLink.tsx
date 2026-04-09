"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
    href: string;
    children: React.ReactNode;
    match?: "exact" | "prefix";
    variant?: "primary" | "muted";
    className?: string;
    onClick?: () => void;
}

export default function NavLink({
    href,
    children,
    match = "exact",
    variant = "muted",
    className = "",
    onClick,
}: NavLinkProps) {
    const pathname = usePathname();
    const hrefPath = href.split("#")[0] || "/";
    const isActive =
        match === "prefix"
            ? pathname === hrefPath || pathname.startsWith(`${hrefPath}/`)
            : pathname === hrefPath;

    if (variant === "primary") {
        const base = "btn-primary magnetic-btn !py-2 !px-4 text-sm";
        const active = isActive ? " ring-2 ring-accent/35 shadow-[0_8px_18px_rgba(222,224,254,0.28)]" : "";
        return (
            <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`${base}${active} ${className}`}
                onClick={onClick}
            >
                {children}
            </Link>
        );
    }

    const base = "rounded-md px-2.5 py-1.5 text-[0.95rem] font-medium transition-colors duration-200";
    const inactive = "text-[rgba(255,255,255,0.75)] hover:text-white";
    const active = "bg-accent/10 text-foreground";

    return (
        <Link
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`${base} ${isActive ? active : inactive} ${className}`}
            onClick={onClick}
        >
            {children}
        </Link>
    );
}
