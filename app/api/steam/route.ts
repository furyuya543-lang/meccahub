import { NextResponse } from 'next/server'
import { buildSteamLoginUrl } from '@/lib/steam-auth'

export async function GET() {
  const base = (process.env.NEXTAUTH_URL || '').replace(/\/$/, '')
  const returnTo = `${base}/api/steam/callback`
  const steamUrl = buildSteamLoginUrl(returnTo, base)
  console.log('[/api/steam] redirecting to Steam, returnTo:', returnTo)
  return NextResponse.redirect(steamUrl)
}
