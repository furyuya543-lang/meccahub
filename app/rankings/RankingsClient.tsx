'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Hide, User } from '@/types'
import { CATEGORY_COLORS, getCurrentWeek } from '@/lib/utils'

type Tab = 'weekly_hides' | 'alltime_hides' | 'weekly_players' | 'alltime_players'

interface PlayerRank {
  id: string
  username: string
  avatar_url: string
  steam_id: string
  total_votes: number
  hide_count: number
}

function getWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString()
}

export function RankingsClient() {
  const [tab, setTab] = useState<Tab>('weekly_hides')
  const [hides, setHides] = useState<Hide[]>([])
  const [players, setPlayers] = useState<PlayerRank[]>([])
  const [loading, setLoading] = useState(true)
  const { week, year } = getCurrentWeek()

  useEffect(() => {
    setLoading(true)
    setHides([])
    setPlayers([])

    if (tab === 'weekly_hides') {
      supabase
        .from('hides')
        .select('*, users(*)')
        .gte('created_at', getWeekStart())
        .order('votes', { ascending: false })
        .limit(25)
        .then(({ data }) => { setHides((data || []) as Hide[]); setLoading(false) })
    } else if (tab === 'alltime_hides') {
      supabase
        .from('hides')
        .select('*, users(*)')
        .order('votes', { ascending: false })
        .limit(25)
        .then(({ data }) => { setHides((data || []) as Hide[]); setLoading(false) })
    } else if (tab === 'weekly_players') {
      supabase
        .from('hides')
        .select('user_id, votes, users(id, username, avatar_url, steam_id)')
        .gte('created_at', getWeekStart())
        .then(({ data }) => {
          const map = new Map<string, PlayerRank>()
          for (const h of (data || [])) {
            const u = h.users as unknown as User
            if (!u) continue
            const existing = map.get(u.id) || { id: u.id, username: u.username, avatar_url: u.avatar_url, steam_id: u.steam_id, total_votes: 0, hide_count: 0 }
            existing.total_votes += h.votes || 0
            existing.hide_count += 1
            map.set(u.id, existing)
          }
          setPlayers(Array.from(map.values()).sort((a, b) => b.total_votes - a.total_votes).slice(0, 25))
          setLoading(false)
        })
    } else {
      supabase
        .from('hides')
        .select('user_id, votes, users(id, username, avatar_url, steam_id)')
        .then(({ data }) => {
          const map = new Map<string, PlayerRank>()
          for (const h of (data || [])) {
            const u = h.users as unknown as User
            if (!u) continue
            const existing = map.get(u.id) || { id: u.id, username: u.username, avatar_url: u.avatar_url, steam_id: u.steam_id, total_votes: 0, hide_count: 0 }
            existing.total_votes += h.votes || 0
            existing.hide_count += 1
            map.set(u.id, existing)
          }
          setPlayers(Array.from(map.values()).sort((a, b) => b.total_votes - a.total_votes).slice(0, 25))
          setLoading(false)
        })
    }
  }, [tab])

  const tabs: { key: Tab; label: string }[] = [
    { key: 'weekly_hides', label: 'Weekly Hides' },
    { key: 'alltime_hides', label: 'All-Time Hides' },
    { key: 'weekly_players', label: 'Weekly Players' },
    { key: 'alltime_players', label: 'All-Time Players' },
  ]

  return (
    <div className="space-y-6">
      {/* Week info */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Week {week}, {year} — Resets every Monday
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800 border border-dark-700 rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 text-xs sm:text-sm font-medium py-2 px-2 sm:px-4 rounded-lg transition-all ${
              tab === t.key
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-dark-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : (tab === 'weekly_hides' || tab === 'alltime_hides') ? (
        hides.length === 0 ? (
          <div className="card p-12 text-center text-gray-500">
            No hides to rank {tab === 'weekly_hides' ? 'this week' : 'yet'}.
          </div>
        ) : (
          <div className="space-y-2">
            {hides.map((hide, i) => (
              <Link key={hide.id} href={`/hide/${hide.id}`}>
                <div className="card p-4 hover:border-brand-500/40 transition-all group flex items-center gap-4">
                  <div className={`w-8 text-center font-black text-lg flex-shrink-0 ${
                    i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-600'
                  }`}>
                    #{i + 1}
                  </div>
                  <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-dark-700 flex-shrink-0">
                    {hide.screenshot_url && (
                      <Image src={hide.screenshot_url} alt={hide.title} fill className="object-cover" sizes="64px" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate group-hover:text-brand-400 transition-colors">
                      {hide.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge text-xs ${CATEGORY_COLORS[hide.category]}`}>{hide.category}</span>
                      {hide.users && <span className="text-xs text-gray-500">by {hide.users.username}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-brand-400 flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                    </svg>
                    <span className="text-white font-bold text-sm">{hide.votes}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        players.length === 0 ? (
          <div className="card p-12 text-center text-gray-500">
            No player rankings {tab === 'weekly_players' ? 'this week' : 'yet'}.
          </div>
        ) : (
          <div className="space-y-2">
            {players.map((player, i) => (
              <Link key={player.id} href={`/profile/${player.steam_id}`}>
                <div className="card p-4 hover:border-brand-500/40 transition-all group flex items-center gap-4">
                  <div className={`w-8 text-center font-black text-lg flex-shrink-0 ${
                    i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-600'
                  }`}>
                    #{i + 1}
                  </div>
                  {player.avatar_url && (
                    <Image
                      src={player.avatar_url}
                      alt={player.username}
                      width={40}
                      height={40}
                      className="rounded-full border border-dark-700 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold group-hover:text-brand-400 transition-colors">
                      {player.username}
                    </p>
                    <p className="text-xs text-gray-500">{player.hide_count} hide{player.hide_count !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-1 text-brand-400 flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                    </svg>
                    <span className="text-white font-bold text-sm">{player.total_votes}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  )
}
