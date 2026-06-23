'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { supabase } from '@/lib/supabase'

interface VoteButtonProps {
  hideId: string
  initialVotes: number
}

export function VoteButton({ hideId, initialVotes }: VoteButtonProps) {
  const { data: session } = useSession()
  const [votes, setVotes] = useState(initialVotes)
  const [hasVoted, setHasVoted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!session) { setChecking(false); return }
    const checkVote = async () => {
      const steamId = (session.user as { steamId?: string }).steamId
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('steam_id', steamId)
        .single()

      if (!user) { setChecking(false); return }

      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('votes')
        .select('id')
        .eq('hide_id', hideId)
        .eq('user_id', user.id)
        .gte('created_at', today)
        .maybeSingle()

      setHasVoted(!!data)
      setChecking(false)
    }
    checkVote()
  }, [session, hideId])

  const handleVote = async () => {
    if (!session) {
      signIn('steam')
      return
    }
    if (hasVoted || loading) return

    setLoading(true)
    try {
      const steamId = (session.user as { steamId?: string }).steamId
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('steam_id', steamId)
        .single()

      if (!user) return

      const { error } = await supabase.from('votes').insert({
        hide_id: hideId,
        user_id: user.id,
      })
      if (error) throw error

      await supabase.rpc('increment_votes', { hide_id: hideId })

      setVotes((v) => v + 1)
      setHasVoted(true)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleVote}
        disabled={hasVoted || loading || checking}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all ${
          hasVoted
            ? 'bg-brand-500/20 border border-brand-500/40 text-brand-400 cursor-default'
            : 'bg-brand-500 hover:bg-brand-600 text-white active:scale-95'
        } disabled:opacity-60`}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
        </svg>
        {hasVoted ? 'Voted Today' : loading ? 'Voting...' : 'Upvote'}
      </button>
      <div className="text-center">
        <span className="text-2xl font-black text-brand-400">{votes}</span>
        <p className="text-xs text-gray-500 mt-0.5">total votes</p>
      </div>
      {hasVoted && (
        <p className="text-xs text-gray-500 text-center">You can vote again tomorrow.</p>
      )}
      {!session && !checking && (
        <p className="text-xs text-gray-500 text-center">
          <button onClick={() => signIn('steam')} className="text-brand-400 hover:underline">Sign in</button> to vote
        </p>
      )}
    </div>
  )
}
