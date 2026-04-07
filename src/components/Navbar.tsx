import { auth } from "@/lib/auth";
import NavbarClient from "@/components/NavbarClient";
import logo from "@/app/logos/nu_logo_name.png";

export default async function Navbar() {
    const session = await auth();

    return <NavbarClient logoSrc={logo.src} user={session?.user} />;
}
