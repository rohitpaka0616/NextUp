"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import NavLink from "@/components/NavLink";
import SignOutButton from "@/components/SignOutButton";
import NavbarLandingLinks, { LANDING_NAV_SECTIONS } from "@/components/NavbarLandingLinks";
import NotificationBell from "@/components/NotificationBell";

const SCROLL_THRESHOLD_PX = 48;

/** Full-width bar → pill: avoid animating backdrop-filter (causes bright fringe with rounded rects). */
const NAV_SHELL_TRANSITION =
    "transition-[padding,gap,min-height,max-width,background-color,border-color,border-radius,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]";

const LOGO_TRANSITION =
    "transition-[width,height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]";

interface NavbarClientProps {
    logoSrc: string;
    user:
        | {
              name?: string | null;
              username?: string;
              avatar?: string | null;
          }
        | undefined;
}

const OFF_HOME_MOBILE_LINKS = [
    { href: "/", label: "Home" },
    { href: "/#spotlight", label: "Spotlight" },
    { href: "/#workspace", label: "Workspace" },
    { href: "/community", label: "Community" },
] as const;

export default function NavbarClient({ logoSrc, user }: NavbarClientProps) {
    const pathname = usePathname();
    const isHome = pathname === "/";
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > SCROLL_THRESHOLD_PX);
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        setMobileNavOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!mobileNavOpen) return;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileNavOpen]);

    useEffect(() => {
        if (!mobileNavOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMobileNavOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [mobileNavOpen]);

    useEffect(() => {
        const onPointerDown = (event: MouseEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        window.addEventListener("mousedown", onPointerDown);
        return () => window.removeEventListener("mousedown", onPointerDown);
    }, []);

    const blendedHome = isHome && !scrolled;
    const moduleHome = isHome && scrolled;

    const navCompact = moduleHome ? "!px-2.5 !py-1.5 !text-[0.82rem] !rounded-lg" : "";

    const closeMobile = () => setMobileNavOpen(false);

    const mobileLinks = isHome ? LANDING_NAV_SECTIONS : OFF_HOME_MOBILE_LINKS;

    return (
        <header
            className={[
                "relative sticky top-0 z-50 w-full",
                "transition-[padding-top,background-color,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                blendedHome &&
                    "border-b border-[rgba(255,255,255,0.07)] bg-[rgba(10,10,20,0.85)] shadow-[0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-[16px]",
                moduleHome && isHome && "border-b border-transparent bg-transparent pt-3 shadow-none backdrop-blur-none md:pt-4",
                !isHome &&
                    "border-b border-[rgba(255,255,255,0.07)] bg-[rgba(10,10,20,0.85)] shadow-[0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-[16px]",
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <div
                className={[
                    "relative",
                    NAV_SHELL_TRANSITION,
                    isHome &&
                        !moduleHome &&
                        "isolate mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-2 rounded-none border border-transparent px-4 sm:px-6 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center",
                    isHome &&
                        moduleHome &&
                        "isolate mx-auto flex min-h-[3.25rem] w-full max-w-[min(100%,68rem)] items-center justify-between gap-2 rounded-full border border-[rgba(255,255,255,0.05)] bg-[#0e1020]/90 px-3 py-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.24)] backdrop-blur-[12px] [backface-visibility:hidden] sm:gap-2 sm:px-3.5 sm:py-2 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center",
                    blendedHome && "md:h-16",
                    !isHome && "mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-2 px-4 sm:px-6 md:gap-3",
                ]
                    .filter(Boolean)
                    .join(" ")}
            >
                <Link
                    href="/#hero"
                    className="relative z-10 flex min-w-0 shrink-0 items-center gap-2 justify-self-start"
                >
                    <div
                        aria-label="NextUp"
                        className={[
                            "logo-mask",
                            LOGO_TRANSITION,
                            moduleHome ? "h-10 w-[94px]" : "h-12 w-[110px]",
                        ].join(" ")}
                        style={{
                            WebkitMaskImage: `url(${logoSrc})`,
                            maskImage: `url(${logoSrc})`,
                        }}
                    />
                </Link>

                <NavbarLandingLinks compact={moduleHome} />

                <div className="relative z-10 flex min-w-0 items-center justify-end justify-self-end gap-1.5 sm:gap-2">
                    {/* Desktop / tablet actions */}
                    <div className="hidden items-center gap-1.5 sm:gap-2 md:flex">
                        {!isHome && (
                            <NavLink href="/community" match="prefix" className={moduleHome ? "!px-2 !py-1 text-xs" : ""}>
                                Community
                            </NavLink>
                        )}
                        {user ? (
                            <>
                                <NotificationBell />
                                <NavLink href="/submit" variant="primary" className={navCompact}>
                                    Submit Idea
                                </NavLink>
                                <div className="relative" ref={menuRef}>
                                    <button
                                        type="button"
                                        onClick={() => setMenuOpen((v) => !v)}
                                        className={`flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1.5 text-left transition-colors duration-200 hover:bg-white/10 ${moduleHome ? "max-w-[9.5rem]" : "max-w-[12rem]"}`}
                                    >
                                        {user.avatar ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={user.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                                        ) : (
                                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/30 text-xs font-bold text-white">
                                                {(user.name?.[0] ?? "U").toUpperCase()}
                                            </span>
                                        )}
                                        <span className="truncate text-sm text-white/90">
                                            @{user.username ?? "user"}
                                        </span>
                                    </button>

                                    {menuOpen && (
                                        <div className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-white/10 bg-[#0e1020] p-1.5 shadow-[0_16px_34px_rgba(0,0,0,0.35)]">
                                            <Link
                                                href={user.username ? `/u/${user.username}` : "/profile"}
                                                onClick={() => setMenuOpen(false)}
                                                className="block rounded-lg px-3 py-2 text-sm text-white/80 transition-colors duration-200 hover:bg-white/10 hover:text-white"
                                            >
                                                My Profile
                                            </Link>
                                            <div className="px-3 py-1.5">
                                                <SignOutButton compact />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <NavLink href="/login" className={moduleHome ? "!px-2 !py-1 text-xs" : ""}>
                                    Sign in
                                </NavLink>
                                <NavLink href="/register" variant="primary" className={navCompact}>
                                    Get started
                                </NavLink>
                            </>
                        )}
                    </div>

                    {/* Mobile menu toggle */}
                    <button
                        type="button"
                        className="flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 text-white/90 transition-colors hover:bg-white/10 md:hidden"
                        aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
                        aria-expanded={mobileNavOpen}
                        onClick={() => setMobileNavOpen((v) => !v)}
                    >
                        <span
                            className={`block h-0.5 w-5 rounded-full bg-current transition-transform duration-300 ${mobileNavOpen ? "translate-y-1.5 rotate-45" : ""}`}
                        />
                        <span className={`block h-0.5 w-5 rounded-full bg-current transition-opacity duration-300 ${mobileNavOpen ? "opacity-0" : ""}`} />
                        <span
                            className={`block h-0.5 w-5 rounded-full bg-current transition-transform duration-300 ${mobileNavOpen ? "-translate-y-1.5 -rotate-45" : ""}`}
                        />
                    </button>
                </div>
            </div>

            {mobileNavOpen && (
                <>
                    <button
                        type="button"
                        aria-label="Close menu"
                        className="fixed inset-0 z-[44] bg-black/45 backdrop-blur-[2px] md:hidden"
                        onClick={closeMobile}
                    />
                    <nav
                        aria-label="Main navigation"
                        className="absolute left-0 right-0 top-full z-[46] mx-2 mt-2 max-h-[min(72vh,calc(100dvh-4.5rem))] overflow-y-auto rounded-2xl border border-white/10 bg-[#0c0c14]/96 p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl md:hidden"
                    >
                        <div className="flex flex-col gap-0.5">
                            {mobileLinks.map(({ href, label }) => (
                                <Link
                                    key={`${href}-${label}`}
                                    href={href}
                                    onClick={closeMobile}
                                    className="block rounded-xl px-3 py-2.5 text-[0.95rem] font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                                >
                                    {label}
                                </Link>
                            ))}
                        </div>

                        <div className="mt-3 border-t border-white/10 pt-3">
                            {user ? (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between gap-2 px-1">
                                        <span className="text-xs font-medium uppercase tracking-wide text-white/40">Alerts</span>
                                        <NotificationBell widePanel />
                                    </div>
                                    <NavLink href="/submit" variant="primary" className="!justify-center !py-3" onClick={closeMobile}>
                                        Submit Idea
                                    </NavLink>
                                    <Link
                                        href={user.username ? `/u/${user.username}` : "/profile"}
                                        onClick={closeMobile}
                                        className="rounded-xl px-3 py-2.5 text-[0.95rem] font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                                    >
                                        My Profile
                                    </Link>
                                    <div className="rounded-xl px-3 py-2">
                                        <SignOutButton compact />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <NavLink href="/login" className="!justify-center !py-3" onClick={closeMobile}>
                                        Sign in
                                    </NavLink>
                                    <NavLink href="/register" variant="primary" className="!justify-center !py-3" onClick={closeMobile}>
                                        Get started
                                    </NavLink>
                                </div>
                            )}
                        </div>
                    </nav>
                </>
            )}
        </header>
    );
}
