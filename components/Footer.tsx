import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#0d0d1a] border-t border-gray-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <span className="text-green-400 font-black text-lg tracking-widest">
              MECCA<span className="text-white">HUB</span>
            </span>
            <p className="text-gray-500 text-sm mt-2 max-w-xs">
              The community ranking hub for Meccha Chameleon. Share your best
              hides, vote on the community&apos;s favourites.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Navigate</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <Link href="/" className="hover:text-green-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/browse" className="hover:text-green-400 transition-colors">
                  Browse Hides
                </Link>
              </li>
              <li>
                <Link href="/rankings" className="hover:text-green-400 transition-colors">
                  Rankings
                </Link>
              </li>
              <li>
                <Link href="/submit" className="hover:text-green-400 transition-colors">
                  Submit a Hide
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Game Info</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>Meccha Chameleon</li>
              <li>Categories: Best Hide, Camouflage, Funniest, Beginner, Impossible</li>
              <li>Maps: Map 1, Map 2, Map 3</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs text-gray-600">
          &copy; {new Date().getFullYear()} MeccaHub. Community site — not affiliated with the game developers.
        </div>
      </div>
    </footer>
  );
}
