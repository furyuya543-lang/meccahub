import Link from "next/link";
import { MAPS } from "@/lib/utils";

export default function Footer() {
  return (
    <footer className="bg-surface/50 border-t border-white/5 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <span className="font-black text-base tracking-tight leading-none">
              <span className="text-white">MECCHA CHAMELEON</span>
              <span className="text-gradient ml-1">HUB</span>
            </span>
            <p className="text-gray-500 text-sm mt-3 max-w-xs leading-relaxed">
              The community ranking hub for Meccha Chameleon. Share your best
              hides, vote on the community&apos;s favourites.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Navigate</h3>
            <ul className="space-y-2.5 text-sm text-gray-500">
              {[
                { href: "/",          label: "Home" },
                { href: "/browse",    label: "Browse Hides" },
                { href: "/rankings",  label: "Rankings" },
                { href: "/archives",  label: "Archives" },
                { href: "/submit",    label: "Submit a Hide" },
                { href: "/submit-map",label: "Submit a Map" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-green-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Game Info</h3>
            <ul className="space-y-2.5 text-sm text-gray-500">
              <li>Meccha Chameleon (App ID 2440510)</li>
              <li>Categories: Best Hide, Camouflage,<br />Funniest, Beginner, Impossible</li>
              <li className="text-green-400/70">{MAPS.length} maps supported</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-8 pt-6 text-center text-xs text-gray-700">
          &copy; {new Date().getFullYear()} MecchaChameleonHub — Community site, not affiliated with the game developers.
        </div>
      </div>
    </footer>
  );
}
