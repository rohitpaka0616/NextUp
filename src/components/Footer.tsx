import Link from "next/link";
import { auth } from "@/lib/auth";
import logo from "@/app/logos/nu_logo_name.png";

export default async function Footer() {
    const session = await auth();

    return (
        <footer className="mt-auto border-t border-border bg-card/85 backdrop-blur-sm">
            <div className="mx-auto max-w-6xl px-6 py-10">
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
                    {/* Brand */}
                    <div className="flex flex-col items-center gap-3 sm:items-start">
                        <Link href="/">
                            <div
                                aria-label="NextUp"
                                className="logo-mask"
                                style={{
                                    WebkitMaskImage: `url(${logo.src})`,
                                    maskImage: `url(${logo.src})`,
                                    width: "65px",
                                    height: "28px",
                                }}
                            />
                        </Link>
                        <p className="text-sm text-muted">
                            Vote for what gets built next.
                        </p>
                    </div>

                    {/* Links */}
                    <div className="flex gap-10 text-sm">
                        <div className="flex flex-col gap-2">
                            <span className="font-semibold text-foreground">Product</span>
                            <Link href="/#ideas" className="text-muted transition-colors hover:text-foreground">Browse Ideas</Link>
                            <Link href="/submit" className="text-muted transition-colors hover:text-foreground">Submit Idea</Link>
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="font-semibold text-foreground">Account</span>
                            {session?.user ? (
                                <Link href="/profile" className="text-muted transition-colors hover:text-foreground">Profile</Link>
                            ) : (
                                <>
                                    <Link href="/login" className="text-muted transition-colors hover:text-foreground">Sign In</Link>
                                    <Link href="/register" className="text-muted transition-colors hover:text-foreground">Get Started</Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted">
                    © {new Date().getFullYear()} NextUp. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
