import { NextRequest, NextResponse } from 'next/server'
import { verifySteamCallback, signSteamToken } from '@/lib/steam-auth'

export async function GET(request: NextRequest) {
  const base = (process.env.NEXTAUTH_URL || '').replace(/\/$/, '')
  const params = request.nextUrl.searchParams

  console.log('[/api/steam/callback] mode:', params.get('openid.mode'))

  const steamId = await verifySteamCallback(params)
  if (!steamId) {
    console.error('[/api/steam/callback] verification failed, redirecting to error')
    return NextResponse.redirect(`${base}/?error=steam_auth_failed`)
  }

  console.log('[/api/steam/callback] verified steamId:', steamId)
  const token = signSteamToken(steamId)
  return NextResponse.redirect(`${base}/auth/steam?token=${encodeURIComponent(token)}`)
}
