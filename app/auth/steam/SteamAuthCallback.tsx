'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

export default function SteamAuthCallback() {
  const params = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const token = params.get('token')
    if (!token) {
      console.error('[steam-callback] no token in URL')
      router.replace('/?error=auth_failed')
      return
    }
    signIn('steam-credentials', { token, callbackUrl: '/' })
  }, [params, router])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 text-sm">Completing sign in...</p>
      </div>
    </div>
  )
}
