import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-dark-900 border-t border-dark-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-500 rounded flex items-center justify-center">
              <span className="text-white font-black text-xs">M</span>
            </div>
            <span className="text-white font-bold text-sm">
              Mecca<span className="text-brand-400">Hub</span>
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <Link href="/" className="hover:text-gray-300 transition-colors">Home</Link>
            <Link href="/browse" className="hover:text-gray-300 transition-colors">Browse</Link>
            <Link href="/rankings" className="hover:text-gray-300 transition-colors">Rankings</Link>
            <Link href="/submit" className="hover:text-gray-300 transition-colors">Submit</Link>
          </div>
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} MeccaHub. Community site for Meccha Chameleon.
          </p>
        </div>
      </div>
    </footer>
  )
}
