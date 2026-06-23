import { Suspense } from 'react'
import { RankingsClient } from './RankingsClient'

export const metadata = {
  title: 'Rankings — MeccaHub',
  description: 'Weekly and all-time hide rankings for Meccha Chameleon.',
}

export default function RankingsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Rankings</h1>
        <p className="text-gray-400">Weekly and all-time leaderboards for hides and players.</p>
      </div>
      <Suspense fallback={<div className="space-y-2">{Array.from({length:10}).map((_,i) => <div key={i} className="card p-4 animate-pulse h-20"/>)}</div>}>
        <RankingsClient />
      </Suspense>
    </div>
  )
}
