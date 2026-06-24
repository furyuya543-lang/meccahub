'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { HideCard } from '@/components/HideCard'
import { Hide } from '@/types'
import { MAPS, CATEGORIES } from '@/lib/utils'

type SortOption = 'votes_desc' | 'votes_asc' | 'newest' | 'oldest'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'votes_desc', label: 'Most Votes' },
  { value: 'votes_asc', label: 'Least Votes' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
]

export function BrowseClient() {
  const [hides, setHides] = useState<Hide[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [map, setMap] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState<SortOption>('votes_desc')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 20

  const fetchHides = useCallback(async (reset = false) => {
    setLoading(true)
    const currentPage = reset ? 0 : page

    let query = supabase
      .from('hides')
      .select('*, users(*)', { count: 'exact' })
      .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1)

    if (search) query = query.ilike('title', `%${search}%`)
    if (map) query = query.eq('map', map)
    if (category) query = query.eq('category', category)

    if (sort === 'votes_desc') query = query.order('votes', { ascending: false })
    else if (sort === 'votes_asc') query = query.order('votes', { ascending: true })
    else if (sort === 'newest') query = query.order('created_at', { ascending: false })
    else if (sort === 'oldest') query = query.order('created_at', { ascending: true })

    const { data, count } = await query
    const items = (data || []) as Hide[]

    if (reset) {
      setHides(items)
      setPage(0)
    } else {
      setHides((prev) => [...prev, ...items])
    }

    setHasMore(items.length === PAGE_SIZE && (count ?? 0) > (currentPage + 1) * PAGE_SIZE)
    setLoading(false)
  }, [search, map, category, sort, page])

  useEffect(() => {
    fetchHides(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, map, category, sort])

  const loadMore = () => {
    setPage((p) => {
      const next = p + 1
      fetchHides(false)
      return next
    })
  }

  const clearFilters = () => {
    setSearch('')
    setMap('')
    setCategory('')
    setSort('votes_desc')
  }

  const hasFilters = search || map || category

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search hides..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-white whitespace-nowrap transition-colors">
              Clear all
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <select value={map} onChange={(e) => setMap(e.target.value)} className="select text-sm">
            <option value="">All Maps</option>
            {MAPS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="select text-sm">
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortOption)} className="select text-sm">
            {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Results */}
      {loading && hides.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : hides.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-400 text-lg mb-2">No hides found</p>
          <p className="text-gray-600 text-sm">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <>
          <div className="text-xs text-gray-500 mb-2">
            {hides.length} result{hides.length !== 1 ? 's' : ''} found
          </div>
          <div className="space-y-2">
            {hides.map((hide) => (
              <HideCard key={hide.id} hide={hide} />
            ))}
          </div>
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={loadMore}
                disabled={loading}
                className="btn-secondary text-sm px-6 py-2"
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
