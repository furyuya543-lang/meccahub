import { createHmac } from 'crypto'

const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login'
const TOKEN_EXPIRY_MS = 2 * 60 * 1000 // 2 minutes

export function buildSteamLoginUrl(returnTo: string, realm: string): string {
  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnTo,
    'openid.realm': realm,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  })
  return `${STEAM_OPENID_URL}?${params.toString()}`
}

export async function verifySteamCallback(searchParams: URLSearchParams): Promise<string | null> {
  const mode = searchParams.get('openid.mode')
  if (mode !== 'id_res') {
    console.error('[steam-auth] unexpected mode:', mode)
    return null
  }

  const claimedId = searchParams.get('openid.claimed_id') || ''
  const steamId = claimedId.replace('https://steamcommunity.com/openid/id/', '')
  if (!steamId || !/^\d+$/.test(steamId)) {
    console.error('[steam-auth] invalid claimed_id:', claimedId)
    return null
  }

  // Rebuild verification params from exactly what Steam sent
  const verifyParams = new URLSearchParams()
  searchParams.forEach((value, key) => {
    verifyParams.set(key, value)
  })
  verifyParams.set('openid.mode', 'check_authentication')

  console.log('[steam-auth] verifying steamId:', steamId)
  console.log('[steam-auth] return_to:', searchParams.get('openid.return_to'))

  const res = await fetch(STEAM_OPENID_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: verifyParams.toString(),
  })

  const text = await res.text()
  console.log('[steam-auth] check_authentication response:', text.slice(0, 300))

  if (!text.includes('is_valid:true')) {
    console.error('[steam-auth] verification failed:', text)
    return null
  }

  return steamId
}

export function signSteamToken(steamId: string): string {
  const expiry = Date.now() + TOKEN_EXPIRY_MS
  const payload = `${steamId}|${expiry}`
  const secret = process.env.NEXTAUTH_SECRET || 'fallback'
  const sig = createHmac('sha256', secret).update(payload).digest('hex')
  return Buffer.from(`${payload}|${sig}`).toString('base64url')
}

export function verifySteamToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString()
    const parts = decoded.split('|')
    if (parts.length < 3) return null

    const sig = parts[parts.length - 1]
    const expiry = parseInt(parts[parts.length - 2])
    const steamId = parts.slice(0, parts.length - 2).join('|')

    if (isNaN(expiry) || Date.now() > expiry) {
      console.log('[steam-auth] token expired')
      return null
    }

    const payload = `${steamId}|${expiry}`
    const secret = process.env.NEXTAUTH_SECRET || 'fallback'
    const expected = createHmac('sha256', secret).update(payload).digest('hex')

    if (sig !== expected) {
      console.log('[steam-auth] token sig mismatch')
      return null
    }

    return steamId
  } catch (err) {
    console.error('[steam-auth] verifySteamToken error:', err)
    return null
  }
}
