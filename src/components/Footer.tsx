import Link from "next/link";
import { auth } from "@/lib/auth";
import logo from "@/app/logos/nu_logo_name.png";

export default async function Footer() {
    const session = await auth();

    return (
        <footer className="mt-auto border-t border-border bg-card/85 backdrop-blur-sm">
            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                    {/* Brand */}
                    <div className="flex flex-col items-center gap-2 sm:items-start sm:gap-3">
                        <Link href="/">
                            <div
                                aria-label="NextUp"
                                className="logo-mask h-6 w-[52px] sm:h-7 sm:w-[65px]"
                                style={{
                                    WebkitMaskImage: `url(${logo.src})`,
                                    maskImage: `url(${logo.src})`,
                                }}
                            />
                        </Link>
                        <p className="max-w-[14rem] text-center text-xs text-muted sm:max-w-none sm:text-left sm:text-sm">
                            Vote for what gets built next.
                        </p>
                    </div>

                    {/* Links */}
                    <div className="flex gap-8 text-xs sm:gap-10 sm:text-sm">
                        <div className="flex flex-col gap-1.5 sm:gap-2">
                            <span className="font-semibold text-foreground">Product</span>
                            <Link href="/#spotlight" className="text-muted transition-colors hover:text-foreground">Spotlight</Link>
                            <Link href="/submit" className="text-muted transition-colors hover:text-foreground">Submit Idea</Link>
                            <Link href="/community" className="text-muted transition-colors hover:text-foreground">Community</Link>
                        </div>
                        <div className="flex flex-col gap-1.5 sm:gap-2">
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
                <div className="mt-5 border-t border-border pt-4 text-center text-[10px] text-muted sm:mt-8 sm:pt-6 sm:text-xs">
                    © {new Date().getFullYear()} NextUp. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
