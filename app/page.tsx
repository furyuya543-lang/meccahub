import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { HideCard } from '@/components/HideCard'
import { Hide } from '@/types'
import { getCurrentWeek, CATEGORY_COLORS, timeAgo } from '@/lib/utils'

async function getHomeData() {
  const { week, year } = getCurrentWeek()

  const [hideOfWeekRes, topWeeklyRes, recentRes] = await Promise.all([
    supabase
      .from('awards')
      .select('*, hides(*, users(*))')
      .eq('award_type', 'hide_of_week')
      .eq('week', week)
      .eq('year', year)
      .single(),
    supabase
      .from('hides')
      .select('*, users(*)')
      .gte('created_at', getWeekStart())
      .order('votes', { ascending: false })
      .limit(5),
    supabase
      .from('hides')
      .select('*, users(*)')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  return {
    hideOfWeek: hideOfWeekRes.data?.hides as Hide | null,
    topWeekly: (topWeeklyRes.data || []) as Hide[],
    recent: (recentRes.data || []) as Hide[],
  }
}

function getWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString()
}

export default async function HomePage() {
  const { hideOfWeek, topWeekly, recent } = await getHomeData()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Hero */}
      <section className="text-center py-12 relative">
        <div className="absolute inset-0 bg-gradient-radial from-brand-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 text-brand-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-brand-400 rounded-full animate-pulse" />
            Community Rankings — Live
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
            Mecca<span className="text-brand-400">Hub</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-8">
            The ultimate community hub for <span className="text-white font-semibold">Meccha Chameleon</span>.
            Submit your best hides, vote on favorites, and claim the top spot.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/submit" className="btn-primary text-sm px-6 py-3">
              Submit a Hide
            </Link>
            <Link href="/browse" className="btn-secondary text-sm px-6 py-3">
              Browse All Hides
            </Link>
          </div>
        </div>
      </section>

      {/* Hide of the Week */}
      {hideOfWeek ? (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-yellow-400/10 border border-yellow-400/20 rounded-lg flex items-center justify-center">
              <span className="text-yellow-400 text-lg">🏆</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Hide of the Week</h2>
          </div>
          <Link href={`/hide/${hideOfWeek.id}`} className="block">
            <div className="card p-0 overflow-hidden hover:border-yellow-400/50 transition-all duration-300 group">
              <div className="relative h-64 md:h-96 w-full bg-dark-700">
                {hideOfWeek.screenshot_url && (
                  <Image
                    src={hideOfWeek.screenshot_url}
                    alt={hideOfWeek.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    priority
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/20 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="badge bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 text-sm px-3 py-1">
                    🏆 Hide of the Week
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white text-2xl font-bold mb-2">{hideOfWeek.title}</h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`badge ${CATEGORY_COLORS[hideOfWeek.category]}`}>
                      {hideOfWeek.category}
                    </span>
                    <span className="text-gray-400 text-sm">{hideOfWeek.map}</span>
                    {hideOfWeek.users && (
                      <span className="text-gray-400 text-sm">by {hideOfWeek.users.username}</span>
                    )}
                    <div className="flex items-center gap-1 text-brand-400 ml-auto">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                      </svg>
                      <span className="text-white font-bold">{hideOfWeek.votes}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>
      ) : (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-yellow-400/10 border border-yellow-400/20 rounded-lg flex items-center justify-center">
              <span className="text-yellow-400 text-lg">🏆</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Hide of the Week</h2>
          </div>
          <div className="card p-12 text-center text-gray-500">
            <p className="text-lg mb-2">No hide selected this week yet.</p>
            <p className="text-sm">Check back later or <Link href="/submit" className="text-brand-400 hover:underline">submit your hide</Link>!</p>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top 5 This Week */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Top 5 This Week</h2>
            <Link href="/rankings" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">
              View all →
            </Link>
          </div>
          {topWeekly.length > 0 ? (
            <div className="space-y-2">
              {topWeekly.map((hide, i) => (
                <HideCard key={hide.id} hide={hide} rank={i + 1} />
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center text-gray-500">
              <p>No hides submitted this week yet.</p>
              <Link href="/submit" className="text-brand-400 hover:underline text-sm mt-2 block">
                Be the first to submit!
              </Link>
            </div>
          )}
        </div>

        {/* Recent Submissions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Recent Submissions</h2>
            <Link href="/browse" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">
              Browse all →
            </Link>
          </div>
          {recent.length > 0 ? (
            <div className="space-y-2">
              {recent.map((hide) => (
                <Link key={hide.id} href={`/hide/${hide.id}`} className="hide-card block group">
                  <div className="flex gap-3 items-center">
                    <div className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-dark-700">
                      {hide.screenshot_url ? (
                        <Image
                          src={hide.screenshot_url}
                          alt={hide.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate group-hover:text-brand-400 transition-colors">
                        {hide.title}
                      </p>
                      <p className="text-gray-500 text-xs">{timeAgo(hide.created_at)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card p-6 text-center text-gray-500 text-sm">
              No submissions yet.
            </div>
          )}
        </div>
      </div>

      {/* Stats banner */}
      <section className="card p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <StatItem label="Total Hides" value="—" />
          <StatItem label="Active Players" value="—" />
          <StatItem label="Votes Cast" value="—" />
          <StatItem label="This Week" value="—" />
        </div>
      </section>
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-black text-brand-400">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}
