'use client'

import { useState, useRef } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { MAPS, CATEGORIES } from '@/lib/utils'

export function SubmitForm() {
  const { data: session } = useSession()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    map: '',
    category: '',
    video_url: '',
  })
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!session) {
    return (
      <div className="card p-8 text-center">
        <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-white font-semibold text-lg mb-2">Sign in to Submit</h2>
        <p className="text-gray-400 text-sm mb-6">You need to be signed in with Steam to submit a hide.</p>
        <button onClick={() => signIn('steam')} className="btn-primary">
          Sign in with Steam
        </button>
      </div>
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB.')
      return
    }
    setScreenshot(file)
    setPreview(URL.createObjectURL(file))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.title.trim()) return setError('Title is required.')
    if (!form.map) return setError('Please select a map.')
    if (!form.category) return setError('Please select a category.')
    if (!screenshot) return setError('A screenshot is required.')

    setSubmitting(true)
    try {
      const steamId = (session.user as { steamId?: string }).steamId
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('steam_id', steamId)
        .single()

      if (!userData) throw new Error('User not found. Please sign out and sign back in.')

      const ext = screenshot.name.split('.').pop()
      const filename = `${userData.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('screenshots')
        .upload(filename, screenshot)

      if (uploadError) throw new Error('Failed to upload screenshot: ' + uploadError.message)

      const { data: { publicUrl } } = supabase.storage
        .from('screenshots')
        .getPublicUrl(filename)

      const { data: hide, error: insertError } = await supabase
        .from('hides')
        .insert({
          user_id: userData.id,
          title: form.title.trim(),
          description: form.description.trim(),
          map: form.map,
          category: form.category,
          screenshot_url: publicUrl,
          video_url: form.video_url.trim() || null,
          votes: 0,
        })
        .select()
        .single()

      if (insertError) throw new Error(insertError.message)

      router.push(`/hide/${hide.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }))

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="card p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Give your hide a catchy name"
            maxLength={100}
            className="input"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Describe the hide spot, how to find it, any tips..."
            rows={3}
            maxLength={1000}
            className="input resize-none"
          />
          <p className="text-xs text-gray-600 mt-1 text-right">{form.description.length}/1000</p>
        </div>

        {/* Map, Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Map <span className="text-red-400">*</span>
            </label>
            <select value={form.map} onChange={(e) => set('map', e.target.value)} className="select">
              <option value="">Select map</option>
              {MAPS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Category <span className="text-red-400">*</span>
            </label>
            <select value={form.category} onChange={(e) => set('category', e.target.value)} className="select">
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Screenshot */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Screenshot <span className="text-red-400">*</span>
          </label>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          {preview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="w-full rounded-lg max-h-64 object-cover" />
              <button
                type="button"
                onClick={() => { setScreenshot(null); setPreview(null) }}
                className="absolute top-2 right-2 bg-dark-900/80 hover:bg-dark-900 text-white rounded-full p-1 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-dark-700 hover:border-brand-500/50 rounded-lg p-8 text-center transition-colors group"
            >
              <svg className="w-8 h-8 text-gray-600 group-hover:text-gray-400 mx-auto mb-2 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-400 text-sm">Click to upload screenshot</p>
              <p className="text-gray-600 text-xs mt-1">PNG, JPG, WebP up to 10MB</p>
            </button>
          )}
        </div>

        {/* Video URL */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Video URL <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <input
            type="url"
            value={form.video_url}
            onChange={(e) => set('video_url', e.target.value)}
            placeholder="https://youtube.com/..."
            className="input"
          />
        </div>
      </div>

      <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-sm">
        {submitting ? 'Submitting...' : 'Submit Hide'}
      </button>
    </form>
  )
}
