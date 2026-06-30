import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="text-8xl font-black text-dark-700 mb-4">404</div>
      <h1 className="text-2xl font-bold text-white mb-3">Page Not Found</h1>
      <p className="text-gray-400 mb-8">The page you&apos;re looking for doesn&apos;t exist or has been removed.</p>
      <Link href="/" className="btn-primary px-6 py-3">
        Back to Home
      </Link>
    </div>
  )
}
