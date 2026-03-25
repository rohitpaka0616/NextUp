import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import SignOutButton from "@/components/SignOutButton";
import logo from "@/app/logos/nu_logo_name.png";

export default async function Navbar() {
    const session = await auth();

    return (
        <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
                <Link href="/" className="flex items-center gap-2">
                    <Image src={logo} alt="NextUp" height={32} className="w-auto" priority />
                </Link>

                <div className="flex items-center gap-3">
                    {session?.user ? (
                        <>
                            <Link
                                href="/submit"
                                className="btn-primary !py-2 !px-4 text-sm"
                            >
                                Submit Idea
                            </Link>
                            <Link
                                href="/profile"
                                className="text-sm text-muted transition-colors hover:text-foreground"
                            >
                                {session.user.name}
                            </Link>
                            <SignOutButton />
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="text-sm text-muted transition-colors hover:text-foreground"
                            >
                                Sign in
                            </Link>
                            <Link
                                href="/register"
                                className="btn-primary !py-2 !px-4 text-sm"
                            >
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
