import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollRevealController from "@/components/ScrollRevealController";

const inter = Inter({ subsets: ["latin"] });
const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "NextUp — Vote for What Gets Built",
  description:
    "Pitch software ideas, vote on the best ones, and the community decides what gets built next.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} ${syne.variable} flex min-h-screen flex-col antialiased`}>
        <AuthProvider>
          <ScrollRevealController />
          <Navbar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 md:py-12">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
