import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Hide, Comment } from '@/types'
import { CATEGORY_COLORS, formatDate } from '@/lib/utils'
import { VoteButton } from './VoteButton'
import { CommentSection } from './CommentSection'

async function getHideData(id: string) {
  const [hideRes, commentsRes] = await Promise.all([
    supabase
      .from('hides')
      .select('*, users(*)')
      .eq('id', id)
      .single(),
    supabase
      .from('comments')
      .select('*, users(*)')
      .eq('hide_id', id)
      .order('created_at', { ascending: true }),
  ])

  return {
    hide: hideRes.data as Hide | null,
    comments: (commentsRes.data || []) as Comment[],
  }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { hide } = await getHideData(params.id)
  return {
    title: hide ? `${hide.title} — MeccaHub` : 'Hide — MeccaHub',
    description: hide?.description || 'View this hide on MeccaHub.',
  }
}

export default async function HidePage({ params }: { params: { id: string } }) {
  const { hide, comments } = await getHideData(params.id)

  if (!hide) notFound()

  const isYouTube = hide.video_url && (hide.video_url.includes('youtube.com') || hide.video_url.includes('youtu.be'))
  const youtubeId = isYouTube
    ? hide.video_url?.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1]
    : null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-gray-300">Home</Link>
        <span>/</span>
        <Link href="/browse" className="hover:text-gray-300">Browse</Link>
        <span>/</span>
        <span className="text-gray-300 truncate">{hide.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Screenshot */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-dark-700">
            {hide.screenshot_url ? (
              <Image
                src={hide.screenshot_url}
                alt={hide.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Video */}
          {youtubeId && (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-dark-700">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title="Hide video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          )}
          {hide.video_url && !youtubeId && (
            <div className="card p-4 flex items-center gap-3">
              <svg className="w-5 h-5 text-brand-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <a href={hide.video_url} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300 text-sm underline">
                Watch video
              </a>
            </div>
          )}

          {/* Description */}
          {hide.description && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Description</h2>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{hide.description}</p>
            </div>
          )}

          {/* Comments */}
          <CommentSection hideId={hide.id} initialComments={comments} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Title & vote */}
          <div className="card p-5">
            <h1 className="text-xl font-bold text-white mb-4">{hide.title}</h1>
            <VoteButton hideId={hide.id} initialVotes={hide.votes} />
          </div>

          {/* Details */}
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Map</span>
                <span className="text-white font-medium">{hide.map}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Category</span>
                <span className={`badge ${CATEGORY_COLORS[hide.category]}`}>{hide.category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Submitted</span>
                <span className="text-white font-medium">{formatDate(hide.created_at)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Comments</span>
                <span className="text-white font-medium">{comments.length}</span>
              </div>
            </div>
          </div>

          {/* Submitter */}
          {hide.users && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Submitted by</h2>
              <Link href={`/profile/${hide.users.steam_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                {hide.users.avatar_url ? (
                  <Image
                    src={hide.users.avatar_url}
                    alt={hide.users.username}
                    width={36}
                    height={36}
                    className="rounded-full border border-dark-700"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-dark-700 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">{hide.users.username[0]?.toUpperCase()}</span>
                  </div>
                )}
                <div>
                  <p className="text-white font-medium text-sm">{hide.users.username}</p>
                  <p className="text-gray-500 text-xs">View profile</p>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
