'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession, signIn } from 'next-auth/react'
import { supabase } from '@/lib/supabase'
import { Comment } from '@/types'
import { timeAgo } from '@/lib/utils'

interface CommentSectionProps {
  hideId: string
  initialComments: Comment[]
}

export function CommentSection({ hideId, initialComments }: CommentSectionProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || submitting) return
    setError('')
    setSubmitting(true)

    try {
      const steamId = (session?.user as { steamId?: string })?.steamId
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('steam_id', steamId)
        .single()

      if (!user) throw new Error('User not found.')

      const { data: comment, error: err } = await supabase
        .from('comments')
        .insert({ hide_id: hideId, user_id: user.id, content: content.trim() })
        .select('*, users(*)')
        .single()

      if (err) throw err

      setComments((prev) => [...prev, comment as Comment])
      setContent('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="section-title">
        Comments <span className="text-gray-500 font-normal text-base">({comments.length})</span>
      </h2>

      {/* Post comment */}
      {session ? (
        <form onSubmit={handleSubmit} className="card p-4 space-y-3">
          <div className="flex gap-3 items-start">
            {session.user?.image && (
              <Image
                src={session.user.image}
                alt={session.user.name || 'You'}
                width={32}
                height={32}
                className="rounded-full border border-dark-700 flex-shrink-0 mt-1"
              />
            )}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a comment..."
              rows={2}
              maxLength={500}
              className="input resize-none flex-1 text-sm"
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">{content.length}/500</span>
            <button type="submit" disabled={submitting || !content.trim()} className="btn-primary text-xs px-4 py-1.5">
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      ) : (
        <div className="card p-4 text-center text-gray-500 text-sm">
          <button onClick={() => signIn('steam')} className="text-brand-400 hover:underline">Sign in</button> to leave a comment.
        </div>
      )}

      {/* Comments list */}
      {comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="card p-4 flex gap-3">
              {comment.users?.avatar_url ? (
                <Link href={`/profile/${comment.users.steam_id}`} className="flex-shrink-0">
                  <Image
                    src={comment.users.avatar_url}
                    alt={comment.users.username}
                    width={32}
                    height={32}
                    className="rounded-full border border-dark-700"
                  />
                </Link>
              ) : (
                <div className="w-8 h-8 rounded-full bg-dark-700 flex-shrink-0 flex items-center justify-center">
                  <span className="text-xs text-gray-500">
                    {comment.users?.username?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  {comment.users && (
                    <Link href={`/profile/${comment.users.steam_id}`} className="text-sm font-medium text-white hover:text-brand-400 transition-colors">
                      {comment.users.username}
                    </Link>
                  )}
                  <span className="text-xs text-gray-600">{timeAgo(comment.created_at)}</span>
                </div>
                <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center text-gray-600 text-sm">
          No comments yet. Be the first to comment!
        </div>
      )}
    </div>
  )
}
