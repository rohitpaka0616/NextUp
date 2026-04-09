"use client";

import { usePathname } from "next/navigation";

export const LANDING_NAV_SECTIONS = [
    { href: "/#hero", label: "Overview" },
    { href: "/#spotlight", label: "Spotlight" },
    { href: "/#workspace", label: "Workspace" },
    { href: "/community", label: "Community" },
] as const;

interface NavbarLandingLinksProps {
    /** Tighter padding when the nav is the scrolled “pill” */
    compact?: boolean;
}

export default function NavbarLandingLinks({ compact = false }: NavbarLandingLinksProps) {
    const pathname = usePathname();
    if (pathname !== "/") return null;

    const linkCls = compact
        ? "px-2 py-1.5 text-[0.95rem] font-medium transition-[padding,font-size] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        : "px-3 py-1.5 text-[0.95rem] font-medium transition-[padding,font-size] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]";

    return (
        <nav
            aria-label="On this page"
            className="pointer-events-none relative z-[5] hidden min-w-0 max-w-full justify-self-center overflow-hidden md:flex md:pointer-events-auto"
        >
            <ul className={`flex items-center ${compact ? "gap-0" : "gap-0.5 sm:gap-1"}`}>
                {LANDING_NAV_SECTIONS.map(({ href, label }) => (
                    <li key={href} className="shrink-0">
                        <a
                            href={href}
                            className={`block rounded-full text-[rgba(255,255,255,0.75)] transition-colors duration-200 hover:bg-white/5 hover:text-white ${linkCls}`}
                        >
                            {label}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
