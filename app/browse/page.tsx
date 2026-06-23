import { Suspense } from 'react'
import { BrowseClient } from './BrowseClient'

export const metadata = {
  title: 'Browse Hides — MeccaHub',
  description: 'Search and filter all community-submitted hides for Meccha Chameleon.',
}

export default function BrowsePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Browse Hides</h1>
        <p className="text-gray-400">Explore all community-submitted hiding spots.</p>
      </div>
      <Suspense fallback={<BrowseSkeleton />}>
        <BrowseClient />
      </Suspense>
    </div>
  )
}

function BrowseSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="card p-4 animate-pulse h-24" />
      ))}
    </div>
  )
}
