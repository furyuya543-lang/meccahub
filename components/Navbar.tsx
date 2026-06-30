"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, Trophy, Search, Home, ArchiveIcon, MapPin, ChevronDown, Upload, Map } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const submitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (submitRef.current && !submitRef.current.contains(e.target as Node)) {
        setSubmitOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <span className="font-black text-base tracking-tight leading-none">
              <span className="text-white">MECCHA CHAMELEON</span>
              <span className="text-gradient ml-1">HUB</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-5">
            <NavLink href="/"         icon={<Home size={14} />}        label="Home" />
            <NavLink href="/browse"   icon={<Search size={14} />}      label="Browse" />
            <NavLink href="/rankings" icon={<Trophy size={14} />}      label="Rankings" />
            <NavLink href="/archives" icon={<ArchiveIcon size={14} />} label="Archives" />
            <NavLink href="/maps"     icon={<MapPin size={14} />}      label="Maps" />

            <div ref={submitRef} className="relative">
              <button
                onClick={() => setSubmitOpen((o) => !o)}
                className="btn-primary text-xs px-4 py-2"
              >
                <Upload size={13} />
                Submit
                <ChevronDown size={12} className={`transition-transform ${submitOpen ? "rotate-180" : ""}`} />
              </button>

              {submitOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                  <SubmitOption
                    href="/submit"
                    icon={<Upload size={14} />}
                    label="Submit a Hide"
                    desc="Share a hiding spot"
                    session={!!session}
                    onClick={() => setSubmitOpen(false)}
                  />
                  <SubmitOption
                    href="/submit-map"
                    icon={<Map size={14} />}
                    label="Submit a Map"
                    desc="Add a Workshop map"
                    session={!!session}
                    onClick={() => setSubmitOpen(false)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {session ? (
              <div className="flex items-center gap-3">
                <Link
                  href={`/profile/${session.user.id}`}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <Image
                    src={session.user.image ?? "/default-avatar.png"}
                    alt={session.user.name ?? "User"}
                    width={32}
                    height={32}
                    className="rounded-full border border-green-400/30"
                  />
                  <span className="text-sm text-gray-300 hidden md:block max-w-[110px] truncate">
                    {session.user.name}
                  </span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-xs text-gray-600 hover:text-gray-300 transition-colors px-2 py-1"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => { window.location.href = `/api/steam?callbackUrl=${encodeURIComponent(window.location.pathname)}`; }}
                className="flex items-center gap-2 bg-surface border border-white/10 hover:border-green-400/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
              >
                <SteamIcon />
                Sign in with Steam
              </button>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-gray-400 hover:text-white transition-colors"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-3 border-t border-white/5 flex flex-col gap-0.5">
            <NavLink href="/"          icon={<Home size={14} />}        label="Home"       mobile />
            <NavLink href="/browse"    icon={<Search size={14} />}      label="Browse"     mobile />
            <NavLink href="/rankings"  icon={<Trophy size={14} />}      label="Rankings"   mobile />
            <NavLink href="/archives"  icon={<ArchiveIcon size={14} />} label="Archives"   mobile />
            <NavLink href="/maps"      icon={<MapPin size={14} />}      label="Maps"       mobile />
            <div className="border-t border-white/5 mt-1 pt-1">
              <NavLink href="/submit"     icon={<Upload size={14} />} label="Submit a Hide" mobile />
              <NavLink href="/submit-map" icon={<Map size={14} />}    label="Submit a Map"  mobile />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function SubmitOption({
  href, icon, label, desc, session, onClick,
}: {
  href: string; icon: React.ReactNode; label: string;
  desc: string; session: boolean; onClick: () => void;
}) {
  const handleClick = (e: React.MouseEvent) => {
    if (!session) {
      e.preventDefault();
      window.location.href = `/api/steam?callbackUrl=${encodeURIComponent(href)}`;
    }
    onClick();
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="flex items-start gap-3 px-4 py-3 hover:bg-surface-2 transition-colors group"
    >
      <span className="text-green-400 mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-white text-sm font-medium group-hover:text-gradient transition-colors">{label}</p>
        <p className="text-gray-500 text-xs">{desc}</p>
      </div>
    </Link>
  );
}

function NavLink({ href, icon, label, mobile }: {
  href: string; icon: React.ReactNode; label: string; mobile?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm font-medium ${
        mobile ? "px-2 py-2.5" : ""
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function SteamIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden>
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.455 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z" />
    </svg>
  );
}
