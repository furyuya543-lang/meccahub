import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SessionProvider from "@/components/SessionProvider";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "MeccaHub — Meccha Chameleon Community Rankings",
  description:
    "The community ranking hub for Meccha Chameleon. Discover, share, and vote on the best hides.",
  openGraph: {
    title: "MeccaHub",
    description: "Meccha Chameleon community rankings and hide database.",
    siteName: "MeccaHub",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a12] text-gray-100 antialiased flex flex-col min-h-screen">
        <SessionProvider session={session}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
