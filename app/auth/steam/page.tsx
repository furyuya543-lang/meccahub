import { Suspense } from 'react'
import SteamAuthCallback from './SteamAuthCallback'

export default function SteamAuthPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">Completing sign in...</p>
        </div>
      </div>
    }>
      <SteamAuthCallback />
    </Suspense>
  )
}
