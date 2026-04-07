"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import NavLink from "@/components/NavLink";
import SignOutButton from "@/components/SignOutButton";
import NavbarLandingLinks from "@/components/NavbarLandingLinks";
import NotificationBell from "@/components/NotificationBell";

const SCROLL_THRESHOLD_PX = 48;

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

export default function NavbarClient({ logoSrc, user }: NavbarClientProps) {
    const pathname = usePathname();
    const isHome = pathname === "/";
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
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

    return (
        <header
            className={[
                "sticky top-0 z-50 w-full transition-all duration-300 ease-out",
                blendedHome &&
                    "border-b border-[rgba(255,255,255,0.07)] bg-[rgba(10,10,20,0.85)] shadow-[0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-[16px]",
                moduleHome && "flex justify-center px-3 pt-3 md:px-4 md:pt-4",
                !isHome &&
                    "border-b border-[rgba(255,255,255,0.07)] bg-[rgba(10,10,20,0.85)] shadow-[0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-[16px]",
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <div
                className={[
                    "relative transition-all duration-300 ease-out",
                    isHome &&
                        !moduleHome &&
                        "mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-4 sm:gap-3 sm:px-6",
                    isHome &&
                        moduleHome &&
                        "grid w-full max-w-[min(100%,68rem)] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 rounded-full border border-white/10 bg-[#0e1020]/68 px-3 py-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.24)] backdrop-blur-[20px] sm:gap-2 sm:px-3.5 sm:py-2",
                    blendedHome && "h-16",
                    moduleHome && "min-h-[3rem]",
                    !isHome && "mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-6",
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
                        className="logo-mask"
                        style={{
                            WebkitMaskImage: `url(${logoSrc})`,
                            maskImage: `url(${logoSrc})`,
                            width: moduleHome ? "94px" : "110px",
                            height: moduleHome ? "40px" : "48px",
                        }}
                    />
                </Link>

                <NavbarLandingLinks compact={moduleHome} />

                <div className="relative z-10 flex min-w-0 items-center justify-end justify-self-end gap-1.5 sm:gap-2">
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
            </div>
        </header>
    );
}
