import Link from 'next/link'
import Image from 'next/image'
import { Hide } from '@/types'
import { CATEGORY_COLORS, timeAgo } from '@/lib/utils'

interface HideCardProps {
  hide: Hide
  rank?: number
}

export function HideCard({ hide, rank }: HideCardProps) {
  return (
    <Link href={`/hide/${hide.id}`} className="hide-card block group">
      <div className="flex gap-3">
        {rank && (
          <div className="flex-shrink-0 w-8 flex items-start justify-center">
            <span className={`text-lg font-black ${rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : rank === 3 ? 'text-amber-600' : 'text-gray-600'}`}>
              #{rank}
            </span>
          </div>
        )}
        <div className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-dark-700">
          {hide.screenshot_url ? (
            <Image
              src={hide.screenshot_url}
              alt={hide.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="80px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm group-hover:text-brand-400 transition-colors truncate">
            {hide.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`badge text-xs ${CATEGORY_COLORS[hide.category] || ''}`}>
              {hide.category}
            </span>
            <span className="text-xs text-gray-600">{hide.map}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              {hide.users && (
                <span className="text-xs text-gray-500">by {hide.users.username}</span>
              )}
              <span className="text-xs text-gray-600">·</span>
              <span className="text-xs text-gray-600">{timeAgo(hide.created_at)}</span>
            </div>
            <div className="flex items-center gap-1 text-brand-400">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              <span className="text-xs font-semibold">{hide.votes}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
