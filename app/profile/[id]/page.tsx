import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { HideCard } from '@/components/HideCard'
import { Hide, User, Award } from '@/types'
import { formatDate } from '@/lib/utils'

async function getProfileData(steamId: string) {
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('steam_id', steamId)
    .single()

  if (!user) return null

  const [hidesRes, awardsRes] = await Promise.all([
    supabase
      .from('hides')
      .select('*, users(*)')
      .eq('user_id', user.id)
      .order('votes', { ascending: false }),
    supabase
      .from('awards')
      .select('*')
      .eq('user_id', user.id)
      .order('year', { ascending: false })
      .order('week', { ascending: false }),
  ])

  const hides = (hidesRes.data || []) as Hide[]
  const awards = (awardsRes.data || []) as Award[]
  const totalVotes = hides.reduce((sum, h) => sum + (h.votes || 0), 0)

  return { user: user as User, hides, awards, totalVotes }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const data = await getProfileData(params.id)
  return {
    title: data ? `${data.user.username} — MeccaHub` : 'Player Profile — MeccaHub',
  }
}

const AWARD_LABELS: Record<string, string> = {
  hide_of_week: '🏆 Hide of the Week',
}

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const data = await getProfileData(params.id)

  if (!data) {
    notFound()
  }

  const { user, hides, awards, totalVotes } = data

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile header */}
      <div className="card p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative w-24 h-24 flex-shrink-0">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={user.username}
              fill
              className="rounded-full border-2 border-brand-500/30 object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-dark-700 flex items-center justify-center border-2 border-dark-600">
              <span className="text-3xl text-gray-500">{user.username[0]?.toUpperCase()}</span>
            </div>
          )}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
            <h1 className="text-2xl font-bold text-white">{user.username}</h1>
            {awards.length > 0 && (
              <span className="badge bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 text-xs">
                🏆 Award Winner
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-1">Member since {formatDate(user.created_at)}</p>
          {user.steam_profile_url && (
            <a
              href={user.steam_profile_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 mt-2 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.007l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0z" />
              </svg>
              View Steam Profile
            </a>
          )}
        </div>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center sm:min-w-[200px]">
          <div>
            <div className="text-2xl font-black text-brand-400">{hides.length}</div>
            <div className="text-xs text-gray-500">Hides</div>
          </div>
          <div>
            <div className="text-2xl font-black text-brand-400">{totalVotes}</div>
            <div className="text-xs text-gray-500">Votes</div>
          </div>
          <div>
            <div className="text-2xl font-black text-brand-400">{awards.length}</div>
            <div className="text-xs text-gray-500">Awards</div>
          </div>
        </div>
      </div>

      {/* Awards */}
      {awards.length > 0 && (
        <div>
          <h2 className="section-title">Awards</h2>
          <div className="flex flex-wrap gap-3">
            {awards.map((award) => (
              <Link key={award.id} href={`/hide/${award.hide_id}`}>
                <div className="card px-4 py-2 hover:border-yellow-400/40 transition-all cursor-pointer">
                  <span className="text-yellow-400 text-sm font-medium">
                    {AWARD_LABELS[award.award_type] || award.award_type}
                  </span>
                  <p className="text-gray-600 text-xs mt-0.5">Week {award.week}, {award.year}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Submitted hides */}
      <div>
        <h2 className="section-title">
          Submitted Hides <span className="text-gray-500 font-normal text-base">({hides.length})</span>
        </h2>
        {hides.length > 0 ? (
          <div className="space-y-2">
            {hides.map((hide) => (
              <HideCard key={hide.id} hide={hide} />
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center text-gray-500">
            <p>No hides submitted yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
