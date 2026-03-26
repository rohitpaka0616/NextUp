import Link from "next/link";
import { auth } from "@/lib/auth";
import SignOutButton from "@/components/SignOutButton";
import NavLink from "@/components/NavLink";
import logo from "@/app/logos/nu_logo_name.png";

export default async function Navbar() {
    const session = await auth();

    return (
        <nav className="sticky top-0 z-50 border-b border-border/80 bg-card/85 shadow-[0_1px_3px_rgba(0,0,0,0.28)] backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                <Link href="/" className="flex items-center gap-2">
                    <div
                        aria-label="NextUp"
                        className="logo-mask"
                        style={{
                            WebkitMaskImage: `url(${logo.src})`,
                            maskImage: `url(${logo.src})`,
                            width: "92px" /* 40px tall at ~2.3 aspect ratio */,
                            height: "40px",
                        }}
                    />
                </Link>

                <div className="flex items-center gap-3">
                    {session?.user ? (
                        <>
                            <NavLink href="/#submit" variant="primary">
                                Submit Idea
                            </NavLink>
                            <NavLink href="/profile" match="prefix">
                                {session.user.name}
                            </NavLink>
                            <SignOutButton />
                        </>
                    ) : (
                        <>
                            <NavLink href="/login">
                                Sign in
                            </NavLink>
                            <NavLink href="/register" variant="primary">
                                Get Started
                            </NavLink>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
